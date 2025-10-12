# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

import json

async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("jupyter-mcp-tools", "get-example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "data": "This is /jupyter-mcp-tools/get-example endpoint!"
    }