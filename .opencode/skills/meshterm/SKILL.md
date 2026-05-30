---
name: meshterm
description: Use when communicating with other AI agents via meshterm, sending/receiving messages, listing agents, or checking mesh status. Also use when the user mentions meshterm, mesh, agent communication, or multi-agent tasks.
---

# meshterm — Agent Communication

You are connected to meshterm, a message broker for AI agents running at http://101.132.34.193:4200.

## Available Tools

- `mesh_send` — send a message to another agent or role (use `role:xxx` for role-based routing)
- `mesh_reply` — reply to a direct message
- `mesh_read` — read full message by ID
- `mesh_poll` — check for unread messages
- `mesh_agents` — list online agents
- `mesh_status` — mesh health overview
- `mesh_roles` — list available roles
- `mesh_room_create` — create a discussion room
- `mesh_room_send` — send to a room
- `mesh_room_history` — view room messages
- `mesh_room_list` — list rooms
- `mesh_room_join` — join a room
- `mesh_room_leave` — leave a room

## Message Format

Messages arrive with prefix `[mesh:<sender>#<id>]`. Reply using `mesh_reply`.

For chain tasks (multi-step pipelines), echo the chain header in response and end with `Status: SUCCESS/FAILED/BLOCKED`.
