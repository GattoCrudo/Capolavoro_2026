IF "%~1"=="" (
    start "" http://localhost:8000
    start "" deno run -A --env-file="%~dp0.env" "%~dp0drumrm_gui.ts"
) ELSE (
    deno run --allow-read --allow-run --allow-write --env-file="%~dp0.env" "%~dp0drumrm.ts" %*
)
