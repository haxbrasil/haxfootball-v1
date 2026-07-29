import { describe, expect, it } from "vitest";
import { Team } from "@runtime/models";
import { isPastOwnLineOfScrimmage } from "./game";

describe("isPastOwnLineOfScrimmage", () => {
    it("detects offensive and defensive encroachment when Red has possession", () => {
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.RED,
                playerTeam: Team.RED,
                playerX: 1,
                lineX: 0,
            }),
        ).toBe(true);
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.RED,
                playerTeam: Team.BLUE,
                playerX: -1,
                lineX: 0,
            }),
        ).toBe(true);
    });

    it("detects offensive and defensive encroachment when Blue has possession", () => {
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.BLUE,
                playerTeam: Team.BLUE,
                playerX: -1,
                lineX: 0,
            }),
        ).toBe(true);
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.BLUE,
                playerTeam: Team.RED,
                playerX: 1,
                lineX: 0,
            }),
        ).toBe(true);
    });

    it("allows both teams on their own sides and exactly on the LOS", () => {
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.RED,
                playerTeam: Team.RED,
                playerX: -1,
                lineX: 0,
            }),
        ).toBe(false);
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.RED,
                playerTeam: Team.BLUE,
                playerX: 1,
                lineX: 0,
            }),
        ).toBe(false);
        expect(
            isPastOwnLineOfScrimmage({
                offensiveTeam: Team.RED,
                playerTeam: Team.BLUE,
                playerX: 0,
                lineX: 0,
            }),
        ).toBe(false);
    });
});
