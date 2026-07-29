import Haxball from "@haxball/game";
import { createModule, updateRoomModules } from "@core/module";
import { api } from "@api/client";
import { env } from "@env/room-server";
import { initI18n } from "@i18n";
import { createRoomConfig } from "./room-server-config";

async function bootstrap() {
    initI18n(env.language);

    const { getConfig, createModules } = await import("@room/managed");

    const modules = createModules({
        commId: env.apiReadiness?.commId,
        liveStateContractJson: env.liveStateContractJson,
        publicWebBaseUrl: env.publicWebBaseUrl,
        ...(env.roomManagerAfkActivityDetectionEnabled !== undefined
            ? {
                  roomManagerAfkActivityDetectionEnabled:
                      env.roomManagerAfkActivityDetectionEnabled,
              }
            : {}),
        ...(env.roomManagerEnabled !== undefined
            ? { roomManagerEnabled: env.roomManagerEnabled }
            : {}),
        ...(env.allowGuestPlay !== undefined
            ? { allowGuestPlay: env.allowGuestPlay }
            : {}),
        ...(env.autoManageNativeAdmins !== undefined
            ? { autoManageNativeAdmins: env.autoManageNativeAdmins }
            : {}),
        roomId: env.apiReadiness?.roomId,
        roomName: env.roomName,
    });

    const HBInit: Function = await Haxball;
    const room = HBInit(createRoomConfig(env, getConfig()));

    updateRoomModules(room, [
        ...modules,
        createModule().onRoomLink(async (_room, url) => {
            if (!env.apiReadiness) {
                return;
            }

            try {
                const result = await api.rooms.reportReady(
                    env.apiReadiness.roomId,
                    {
                        commId: env.apiReadiness.commId,
                        roomLink: url,
                    },
                );

                if (!result.ok) {
                    throw result.error;
                }
            } catch (error) {
                console.error("Failed to report room ready:", error);
            }
        }),
    ]);
}

bootstrap().catch((error) => {
    console.error("Failed to bootstrap room-server environment:", error);
    process.exitCode = 1;
});
