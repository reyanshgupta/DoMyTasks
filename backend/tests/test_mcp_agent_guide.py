import pytest
from fastmcp.client import Client

from domytasks.mcp.server import mcp


@pytest.fixture
async def guide_client():
    async with Client(mcp) as client:
        yield client


async def test_initialize_includes_routing_instructions(guide_client):
    assert guide_client.initialize_result is not None
    instructions = guide_client.initialize_result.instructions
    assert instructions is not None
    assert "DoMyTasks" in instructions
    assert "task_kanban" in instructions


async def test_prompts_registered(guide_client):
    prompts = await guide_client.list_prompts()
    names = {p.name for p in prompts}
    assert names >= {"task_triage", "add_task_from_chat", "pick_up_task"}


async def test_agent_guide_resource(guide_client):
    resources = await guide_client.list_resources()
    assert any(str(r.uri) == "domytasks://agent-guide" for r in resources)

    result = await guide_client.read_resource("domytasks://agent-guide")
    text = result[0].text
    assert "title" in text
    assert "context" in text


async def test_task_triage_prompt_content(guide_client):
    result = await guide_client.get_prompt("task_triage", {})
    messages = result.messages
    assert len(messages) >= 1
    content = messages[0].content.text
    assert "task_kanban" in content


async def test_discovery_tool_descriptions(guide_client):
    tools = await guide_client.list_tools()
    by_name = {t.name: t.description for t in tools}

    assert "backlog" in by_name["task_list"].lower()
    assert "standup" in by_name["task_kanban"].lower()
    assert "capture" in by_name["task_create"].lower()


async def test_add_task_from_chat_prompt_with_hint(guide_client):
    result = await guide_client.get_prompt("add_task_from_chat", {"workstream_hint": "Engineering"})
    content = result.messages[0].content.text
    assert "Engineering" in content


async def test_pick_up_task_prompt_with_hint(guide_client):
    result = await guide_client.get_prompt("pick_up_task", {"task_hint": "Fix auth"})
    content = result.messages[0].content.text
    assert "Fix auth" in content
