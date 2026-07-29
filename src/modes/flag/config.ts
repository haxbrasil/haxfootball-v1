import * as ConfigUtils from "@common/general/config";
import { t } from "@lingui/core/macro";

export const {
    defaultConfig,
    createConfig,
    getFlagNames: getConfigFlagNames,
    hasFlag: hasConfigFlag,
    getFlagDescription: getConfigFlagDescription,
    getFlagValue: getConfigFlagValue,
    setFlagValue: setConfigFlagValue,
} = ConfigUtils.createConfig({
    defaultConfig: {
        flags: {
            timeouts: true,
        },
    },
    flags: {
        TIMEOUTS: {
            description: t`Enables the hike timeout.`,
            getValue: (config) => config.flags.timeouts,
            setValue: (config, value) => {
                config.flags = {
                    ...config.flags,
                    timeouts: value,
                };
            },
        },
    },
    clone: (config) => ({
        ...config,
        flags: {
            ...config.flags,
        },
    }),
});

export type Config = ReturnType<typeof createConfig>;
export type ConfigFlagName = ReturnType<typeof getConfigFlagNames>[number];
