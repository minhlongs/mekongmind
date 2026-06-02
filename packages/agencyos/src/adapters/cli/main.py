"""AgencyOS CLI — Typer entry point."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Optional

from importlib.metadata import version as _pkg_version

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


def _read_version() -> str:
    try:
        return _pkg_version("agencyos")
    except Exception:
        return "0.1.0-dev"


app = typer.Typer(
    name="agencyos",
    help="AgencyOS (Mekong Mind) — Multi-agent Business OS.",
    no_args_is_help=True,
)
console = Console()


# ------------------------------------------------------------------ Route #
@app.command()
def route(
    company_id: str = typer.Option(..., "--company-id", "-c", help="Company / tenant ID."),
    depot_lat: float = typer.Option(10.8231, "--lat", help="Depot latitude (WGS84)."),
    depot_lng: float = typer.Option(106.6297, "--lng", help="Depot longitude (WGS84)."),
    waypoints_json: Optional[str] = typer.Option(None, "--waypoints", "-w", help="JSON array of {lat,lng,name}."),
    algorithm: str = typer.Option("ortools_cvrp", "--algorithm", "-a", help="Solver: ortools_cvrp|nearest_neighbor"),
) -> None:
    """Run route optimization and print a summary."""
    from domain.value_objects.coordinates import Coordinates
    from application.use_cases.optimize_route import RouteOptimizationRequest

    waypoints_raw: list[dict] = []
    if waypoints_json:
        try:
            waypoints_raw = json.loads(waypoints_json)
        except json.JSONDecodeError as exc:
            console.print(f"[red]Invalid --waypoints JSON:[/red] {exc}")
            raise typer.Exit(code=2)

    depot = Coordinates(lat=depot_lat, lng=depot_lng)
    vo_waypoints = [
        {"lat": wp["lat"], "lng": wp["lng"], "name": wp.get("name") or f"Stop-{i+1}"}
        for i, wp in enumerate(waypoints_raw)
        if "lat" in wp and "lng" in wp
    ]

    request = RouteOptimizationRequest(
        plan_id=f"cli-{company_id}-{int(asyncio.get_event_loop().time())}",
        company_id=company_id,
        depot=depot,
        waypoints=vo_waypoints,
        constraints={"algorithm": algorithm},
    )

    async def _run():
        return await build_optimize_route().execute(request)

    with console.status("[bold green]Running route optimizer..."):
        try:
            plan = asyncio.run(_run())
        except Exception as exc:  # pragma: no cover
            console.print(f"[red]Optimization failed:[/red] {exc}")
            raise typer.Exit(code=1)

    _print_plan(console, plan)


def _print_plan(console: Console, plan) -> None:
    table = Table(title=f"RoutePlan {plan.plan_id}")
    table.add_column("Order", justify="right", style="cyan")
    table.add_column("Waypoint")
    table.add_column("Coordinates")
    for wp in plan.waypoints:
        table.add_row(str(wp.order), wp.name, f"{wp.coordinates.lat:.6f}, {wp.coordinates.lng:.6f}")
    console.print(table)

    summary = (
        f"Distance: [bold]{plan.total_distance.km:,.1f}[/bold] km • "
        f"Est.: [bold]{plan.estimated_duration_min}[/bold] min • "
        f"Cost: [bold]{plan.total_cost}[/bold] • "
        f"Algorithm: {plan.algorithm_used} • "
        f"Carrier: {plan.carrier}"
    )
    console.print(Panel(summary, title="Summary"))


# ----------------------------------------------------------------- Agent #
@app.command()
def agent_run(
    role: str = typer.Option(..., "--role", "-r", help="Agent role, e.g. operations."),
    task_title: str = typer.Option(..., "--title", "-t", help="Task title."),
) -> None:
    """Run a single agent task (fire-and-forget)."""
    async def _run() -> dict:
        from kernel.bootstrap import build_run_agent_task

        req = type("RunAgentTaskRequest", (), {"role": role, "title": task_title})()
        result = await build_run_agent_task().execute(req)
        if hasattr(result, "model_dump"):
            return result.model_dump()
        if hasattr(result, "__dict__"):
            return result.__dict__
        return {"result": str(result)}

    with console.status(f"[bold green]Running {role} agent..."):
        try:
            result = asyncio.run(_run())
        except Exception as exc:
            console.print(f"[red]Agent task failed:[/red] {exc}")
            raise typer.Exit(code=1)

    console.print_json(data=result)


# --------------------------------------------------------------- Health #
@app.command()
def health() -> None:
    """Quick health check of the bootstrap."""
    from kernel.bootstrap import AgencyOSKernel

    async def _check() -> dict:
        kernel = AgencyOSKernel()
        return await kernel.start(parallel=False)

    try:
        comps = asyncio.run(_check())
    except Exception as exc:
        console.print(f"[red]Health check failed:[/red] {exc}")
        raise typer.Exit(code=1)

    console.print(f"[green]OK.[/green] Components loaded: {sorted(comps.keys())}")


# -------------------------------------------------------------- Dify #
dify_app = typer.Typer(
    name="dify",
    help="Dify integration — LLM apps, chat, knowledge.",
    no_args_is_help=True,
)
app.add_typer(dify_app)


@dify_app.command("app")
def dify_app_cmd(
    name: str = typer.Option(..., "--name", "-n", help="App name."),
    mode: str = typer.Option(..., "--mode", "-m", help="chat | agent | completion | workflow"),
    description: str = typer.Option("", "--description", "-d", help="App description."),
    api_url: str = typer.Option("http://localhost:5001", "--api-url", help="Dify API base URL."),
    api_key: str = typer.Option(..., "--api-key", help="Dify API key."),
) -> None:
    """Create and publish a new LLM app in Dify."""
    from domain.value_objects.dify_client_config import DifyClientConfig
    from adapters.dify.dify_http_client import DifyHTTPClient
    from adapters.dify.dify_service_adapter import DifyServiceAdapter
    from application.use_cases.dify_use_cases import DifyUseCases

    cfg = DifyClientConfig(api_url=api_url, api_key=api_key)
    with DifyHTTPClient(cfg) as client:
        adapter = DifyServiceAdapter(cfg, client)
        use_cases = DifyUseCases(adapter, cfg)

        async def _run():
            app_obj = await use_cases.create_llm_app(
                name=name, mode=mode, description=description or None
            )
            return await use_cases.publish_llm_app(app_obj.id)

        with console.status(f"[bold green]Creating Dify app '{name}'..."):
            try:
                published = asyncio.run(_run())
            except Exception as exc:
                console.print(f"[red]Dify app creation failed:[/red] {exc}")
                raise typer.Exit(code=1)

    table = Table(title=f"Dify App {published.id}")
    table.add_column("Field", style="cyan")
    table.add_column("Value")
    for field in ("id", "name", "mode", "status"):
        table.add_row(field, str(getattr(published, field)))
    console.print(table)


@dify_app.command("chat")
def dify_chat_cmd(
    app_id: str = typer.Option(..., "--app-id", "-a", help="LLM app id."),
    message: str = typer.Option(..., "--message", "-m", help="User message."),
    user_id: str = typer.Option("cli-user", "--user", help="User id."),
    api_url: str = typer.Option("http://localhost:5001", "--api-url", help="Dify API base URL."),
    api_key: str = typer.Option(..., "--api-key", help="Dify API key."),
) -> None:
    """Send a chat message to a Dify app and print the reply."""
    from domain.value_objects.dify_client_config import DifyClientConfig
    from adapters.dify.dify_http_client import DifyHTTPClient
    from adapters.dify.dify_service_adapter import DifyServiceAdapter
    from application.use_cases.dify_use_cases import DifyUseCases

    cfg = DifyClientConfig(api_url=api_url, api_key=api_key)
    with DifyHTTPClient(cfg) as client:
        adapter = DifyServiceAdapter(cfg, client)
        use_cases = DifyUseCases(adapter, cfg)

        with console.status("[bold green]Sending chat message..."):
            try:
                conv, assistant_msg = asyncio.run(
                    use_cases.chat_with_app(app_id=app_id, user_message=message, user_id=user_id)
                )
            except Exception as exc:
                console.print(f"[red]Chat failed:[/red] {exc}")
                raise typer.Exit(code=1)

    console.print_json(data={
        "conversation_id": conv.id,
        "role": assistant_msg.role.value,
        "content": assistant_msg.content,
    })


@dify_app.command("knowledge")
def dify_knowledge_cmd(
    action: str = typer.Argument(..., help="list | create | upload | query"),
    name: str = typer.Option("Untitled", "--name", "-n", help="Name (for create/upload)."),
    text: str = typer.Option("", "--text", "-t", help="Text content (for upload)."),
    query: str = typer.Option("", "--query", "-q", help="Query text (for query)."),
    top_k: int = typer.Option(5, "--top-k", help="Top-k chunks to retrieve."),
    dataset_id: str = typer.Option("", "--dataset-id", "-d", help="Dataset id (for upload/query)."),
    api_url: str = typer.Option("http://localhost:5001", "--api-url", help="Dify API base URL."),
    api_key: str = typer.Option(..., "--api-key", help="Dify API key."),
) -> None:
    """Manage Dify knowledge bases (RAG datasets)."""
    from domain.value_objects.dify_client_config import DifyClientConfig
    from adapters.dify.dify_http_client import DifyHTTPClient
    from adapters.dify.dify_service_adapter import DifyServiceAdapter
    from application.use_cases.dify_use_cases import DifyUseCases

    cfg = DifyClientConfig(api_url=api_url, api_key=api_key)
    with DifyHTTPClient(cfg) as client:
        adapter = DifyServiceAdapter(cfg, client)
        use_cases = DifyUseCases(adapter, cfg)

        async def _run():
            if action == "list":
                return await use_cases._port.list_datasets()
            if action == "create":
                return await use_cases.create_knowledge(name=name)
            if action == "upload":
                if not dataset_id:
                    raise ValueError("--dataset-id required for upload")
                return await use_cases.upload_document(dataset_id=dataset_id, text=text, name=name)
            if action == "query":
                if not dataset_id:
                    raise ValueError("--dataset-id required for query")
                return await use_cases._port.query_knowledge(dataset_id=dataset_id, query=query, top_k=top_k)
            raise ValueError(f"Unknown action: {action} (expected list|create|upload|query)")

        with console.status(f"[bold green]knowledge {action}..."):
            try:
                out = asyncio.run(_run())
            except Exception as exc:
                console.print(f"[red]knowledge {action} failed:[/red] {exc}")
                raise typer.Exit(code=1)

    console.print_json(data=out)


def main() -> int:
    app()
    return 0


if __name__ == "__main__":
    sys.exit(main())
