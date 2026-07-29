import { afterEach, describe, expect, it, vi } from "vitest";
import type { Room } from "@core/room";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("room setup", () => {
    it("applies the common room settings when the room opens", async () => {
        const module = await loadRoomSetupModule();
        const room = createRoom();

        module.call("onRoomLink", room, "https://example.com/room");

        expect(room.lockTeams).toHaveBeenCalledOnce();
        expect(room.setScoreLimit).toHaveBeenCalledWith(0);
        expect(room.setTimeLimit).toHaveBeenCalledWith(10);
    });
});

async function loadRoomSetupModule() {
    const required = {
        DEBUG: "false",
        TUTORIAL_LINK: "https://example.com/tutorial",
        DISCORD_LINK: "https://example.com/discord",
    };

    for (const [key, value] of Object.entries(required)) {
        vi.stubEnv(key, value);
    }

    vi.resetModules();

    const { createRoomSetupModule } = await import("./room-setup");

    return createRoomSetupModule();
}

function createRoom(): Room {
    return {
        lockTeams: vi.fn<Room["lockTeams"]>(),
        setScoreLimit: vi.fn<Room["setScoreLimit"]>(),
        setTimeLimit: vi.fn<Room["setTimeLimit"]>(),
    } as unknown as Room;
}
