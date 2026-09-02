---
description: Prohibits the use of mocked data or simulated execution when running pipelines or tests.
---

# No Shortcutting Rule

When asked to run a pipeline, subagent, or test, you must **NEVER** take shortcuts by mocking data, writing simulated outputs via custom scripts, or using placeholder information to "speed up" the execution.

The primary purpose of running these pipelines is to test the integration and uncover real-world issues, edge cases, and formatting bugs in the actual execution environment.

1. **Always invoke the actual subagents and tools** (e.g., `invoke_subagent`, `run_command` for full scripts) instead of simulating their behavior.
2. **Always perform real data retrieval** (e.g., using `read_url_content` or `search_web`) rather than injecting static URLs or hallucinating facts from pre-training memory.
3. If a pipeline takes a long time to run due to heavy web scraping or processing, you must let it run naturally rather than writing a mock script to bypass the wait. 

Taking shortcuts defeats the purpose of iterative debugging. You must run all tasks clean and raw every time.
