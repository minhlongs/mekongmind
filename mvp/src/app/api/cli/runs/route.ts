import { NextRequest, NextResponse } from 'next/server';
import { verifyCliApiBearerAuth } from '@/lib/cli-api-auth';
import { executeCliCommand } from '@/lib/cli-execution-bridge';

export async function POST(request: NextRequest) {
  const auth = verifyCliApiBearerAuth(request.headers.get('authorization'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const commandId = typeof body?.command_id === 'string' ? body.command_id.trim() : '';
    const params = typeof body?.params === 'object' && body.params !== null ? body.params : {};
    const runId = typeof body?.run_id === 'string' ? body.run_id : undefined;

    if (!commandId) {
      return NextResponse.json(
        { error: 'command_id is required', code: 'MISSING_COMMAND_ID' },
        { status: 400 }
      );
    }

    const result = await executeCliCommand(commandId, params, runId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected execution error';
    return NextResponse.json(
      { error: message, code: 'EXECUTION_FAILED' },
      { status: 500 }
    );
  }
}
