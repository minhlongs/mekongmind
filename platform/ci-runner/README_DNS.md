# Runner DNS fix (one-time setup)

The M1 Max self-hosted runner uses a shell wrapper `start-runner.sh` that pins
DNS to 1.1.1.1 / 8.8.8.8 when the default macOS resolvers (127.0.0.x — Cloudflare
WARP-style local proxy) fail to resolve github.com.

Pinning requires passwordless sudo for the `networksetup` command. Configure once:

```bash
echo "$(whoami) ALL=(ALL) NOPASSWD: /usr/sbin/networksetup -setdnsservers *" | sudo tee /etc/sudoers.d/mekong-runner-dns
sudo chmod 440 /etc/sudoers.d/mekong-runner-dns
```

Then restart the runner via tmux:

```bash
tmux kill-session -t mekong-runner 2>/dev/null || true
tmux new-session -d -s mekong-runner -c ~/actions-runner-mekong './start-runner.sh'
```
