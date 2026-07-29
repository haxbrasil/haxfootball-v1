import { beforeEach, describe, expect, it, vi } from "vitest";

const nodeHaxball = vi.hoisted(() => {
    const OperationType = {
        SendChatIndicator: 1,
        SendInput: 3,
        SendChat: 4,
        KickBanPlayer: 6,
        StartGame: 7,
        StopGame: 8,
        PauseResumeGame: 9,
        SetPlayerTeam: 12,
        SetTeamsLock: 13,
        AutoTeams: 15,
    };
    const players = [
        {
            id: 1,
            name: "Player",
            team: { id: 0 },
            flag: "br",
            avatar: "P",
            headlessAvatar: null,
            isAdmin: false,
            conn: "3132372e302e302e31",
            auth: "auth-1",
            disc: null,
        },
        {
            id: 2,
            name: "Target",
            team: { id: 0 },
            flag: "br",
            avatar: "T",
            headlessAvatar: null,
            isAdmin: false,
            conn: "3132372e302e302e32",
            auth: "auth-2",
            disc: null,
        },
    ];
    const room = {
        players,
        gameState: null,
        state: { teamsLocked: false },
        startRecording: vi.fn<() => boolean>(() => true),
        stopRecording: vi.fn<() => Uint8Array>(() =>
            Uint8Array.from([1, 2, 3]),
        ),
        fakeSendPlayerInput: vi.fn<(input: number, playerId: number) => void>(),
        fakePlayerJoin:
            vi.fn<
                (
                    id: number,
                    name: string,
                    flag: string,
                    avatar: string,
                    conn: string,
                    auth: string,
                ) => void
            >(),
        fakePlayerLeave: vi.fn<(playerId: number) => void>(),
        modifyPlayerData: vi.fn<
            (
                id: number,
                name: string,
                flag: string,
                avatar: string,
                conn: string,
                auth: string,
            ) => Promise<null | [string, string, string]>
        >(
            async (
                _id: number,
                _name: string,
                _flag: string,
                _avatar: string,
                _conn: string,
                _auth: string,
            ): Promise<null | [string, string, string]> => null,
        ),
        onBeforeOperationReceived: vi.fn<
            (type: number, message: unknown) => boolean
        >((_type: number, _message: unknown): boolean => true),
        onPlayerSyncChange: vi.fn<(id: number, synchronized: boolean) => void>(
            (_id: number, _synchronized: boolean): void => {},
        ),
        getPlayer: (id: number) =>
            players.find((player) => player.id === id) ?? null,
    };
    const api = {
        CollisionFlags: {
            ball: 1,
            red: 2,
            blue: 4,
            redKO: 8,
            blueKO: 16,
            wall: 32,
            kick: 64,
            score: 128,
            c0: 256,
            c1: 512,
            c2: 1024,
            c3: 2048,
        },
        OperationType,
        Room: {
            create: vi.fn<
                (
                    config: unknown,
                    callbacks: {
                        preInit(room: unknown): void;
                        onOpen(room: unknown): void;
                    },
                ) => {
                    cancel: () => void;
                    useRecaptchaToken: () => void;
                }
            >(
                (
                    _config: unknown,
                    callbacks: {
                        preInit(room: unknown): void;
                        onOpen(room: unknown): void;
                    },
                ) => {
                    callbacks.preInit(room);
                    callbacks.onOpen(room);
                    return {
                        cancel: vi.fn<() => void>(),
                        useRecaptchaToken: vi.fn<() => void>(),
                    };
                },
            ),
        },
        Utils: {
            hexStrToNumber: (value: string) =>
                Buffer.from(value, "hex").toString(),
            getGeo: vi.fn<
                () => Promise<{ lat: number; lon: number; flag: string }>
            >(),
            runAfterGameTick: (callback: () => void) => callback(),
        },
    };

    return { api, OperationType, room };
});

vi.mock("node-haxball", () => ({
    default: () => nodeHaxball.api,
}));

import Haxball from "./game";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("node-haxball compatibility adapter", () => {
    it("applies asynchronous pre-join identity changes", async () => {
        const room = await createRoom();
        room.onBeforePlayerJoin = async (player) => ({
            name: `${player.name} Verified`,
            avatar: "V",
        });

        await expect(
            nodeHaxball.room.modifyPlayerData(
                3,
                "Guest",
                "br",
                "G",
                "conn",
                "auth",
            ),
        ).resolves.toEqual(["Guest Verified", "br", "V"]);
    });

    it("runs canonical operation guards before accepting chat", async () => {
        const room = await createRoom();
        const beforeOperation = vi.fn<
            (operation: RoomOperationObject) => boolean
        >(() => false);
        const playerChat = vi.fn<
            (player: PlayerObject, message: string) => boolean
        >(() => true);
        room.onBeforeOperation = beforeOperation;
        room.onPlayerChat = playerChat;

        const accepted = nodeHaxball.room.onBeforeOperationReceived(
            nodeHaxball.OperationType.SendChat,
            { byId: 1, text: "hello" },
        );

        expect(accepted).toBe(false);
        expect(beforeOperation).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: "chat",
                byPlayer: expect.objectContaining({ id: 1 }),
                message: "hello",
            }),
        );
        expect(playerChat).not.toHaveBeenCalled();
    });

    it("reports node synchronization status as the inverse desync state", async () => {
        const room = await createRoom();
        const onPlayerSyncChange =
            vi.fn<(player: PlayerObject, desynced: boolean) => void>();
        room.onPlayerSyncChange = onPlayerSyncChange;

        nodeHaxball.room.onPlayerSyncChange(1, false);
        nodeHaxball.room.onPlayerSyncChange(1, true);

        expect(onPlayerSyncChange).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ id: 1 }),
            true,
        );
        expect(onPlayerSyncChange).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ id: 1 }),
            false,
        );
    });

    it("maps team operations to their affected player", async () => {
        const room = await createRoom();
        const onBeforeOperation = vi.fn<
            (operation: RoomOperationObject) => boolean
        >(() => true);
        room.onBeforeOperation = onBeforeOperation;

        const accepted = nodeHaxball.room.onBeforeOperationReceived(
            nodeHaxball.OperationType.SetPlayerTeam,
            { byId: 1, playerId: 2, team: { id: 1 } },
        );

        expect(accepted).toBe(true);
        expect(onBeforeOperation).toHaveBeenCalledWith({
            kind: "player-team",
            byPlayer: expect.objectContaining({ id: 1 }),
            targetPlayers: [expect.objectContaining({ id: 2 })],
            message: { playerId: 2, team: 1 },
        });
    });

    it("lets the dedicated stop guard reject a stop before generic guards", async () => {
        const room = await createRoom();
        const onBeforeGameStop = vi.fn<
            (
                operation: Extract<RoomOperationObject, { kind: "stop-game" }>,
            ) => boolean
        >(() => false);
        const onBeforeOperation = vi.fn<
            (operation: RoomOperationObject) => boolean
        >(() => true);
        room.onBeforeGameStop = onBeforeGameStop;
        room.onBeforeOperation = onBeforeOperation;

        const accepted = nodeHaxball.room.onBeforeOperationReceived(
            nodeHaxball.OperationType.StopGame,
            { byId: 1 },
        );

        expect(accepted).toBe(false);
        expect(onBeforeGameStop).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "stop-game" }),
        );
        expect(onBeforeOperation).not.toHaveBeenCalled();
    });

    it("uses native recording and fake input primitives", async () => {
        const room = await createRoom();

        expect(room.startRecording()).toBe(true);
        expect(room.stopRecording()).toEqual(Uint8Array.from([1, 2, 3]));

        room.dispatch({ type: "playerInput", playerId: 1, input: 17 });

        expect(nodeHaxball.room.fakeSendPlayerInput).toHaveBeenCalledWith(
            17,
            1,
        );
    });
});

async function createRoom(): Promise<RoomObject> {
    const HBInit: Function = await Haxball;

    return HBInit({
        roomName: "HaxFootball 1 Test",
        maxPlayers: 10,
        public: false,
        noPlayer: true,
        token: "test-token",
        geo: { code: "br", lat: 0, lon: 0 },
    }) as RoomObject;
}
