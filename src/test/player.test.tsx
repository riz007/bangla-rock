import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { expect, test, vi } from "vitest";
import { Player, type Skin } from "../components/Player";
import { ALBUMS } from "../data/albums";

const agent = createAgent();

function deck(skin: Skin, sources = ["dQw4w9WgXcQ"]) {
  const spy = {
    onSkin: vi.fn(),
    onStep: vi.fn(),
    onLink: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <Player
      album={ALBUMS[0]}
      sources={sources}
      tracks={["Side A opener", "Closer"]}
      real={false}
      playToken={0}
      searchUrl="https://www.youtube.com/results?search_query=x"
      skin={skin}
      {...spy}
    />,
  );
  return spy;
}

test("an agent can find and drive every deck control", async () => {
  const spy = deck("tape");
  const components = agent
    .snapshot()
    .filter((e) => !e.offPage && e.component !== "more");
  for (const e of components)
    expect(e.label, `${e.component} ${e.ref} has no name`).toBeTruthy();
  const labels = components.map((e) => e.label);
  for (const label of [
    "Player skin",
    "Expand player",
    "Close player",
    "Previous album",
    "Play",
    "Next album",
    "Stop",
    "Pause",
    "Eject",
    "Seek",
    "Volume",
  ])
    expect(labels, `${label} is missing from the snapshot`).toContain(label);

  const result = await agent.act({
    steps: [
      { ref: "Volume", action: "setValue", args: [40] },
      { ref: "Player skin", action: "setValue", args: ["Desktop ’98"] },
      { ref: "Next album", action: "press" },
      { ref: "Previous album", action: "press" },
      { ref: "Eject", action: "press" },
    ],
  });
  expect(result.ok, result.error?.message).toBe(true);
  expect(localStorage.getItem("bcc:vol")).toBe("40");
  expect(spy.onSkin).toHaveBeenCalledWith("desktop");
  expect(spy.onStep.mock.calls).toEqual([[1], [-1]]);

  const load = await agent.act({
    steps: [
      {
        ref: "YouTube link",
        action: "setValue",
        args: ["https://youtu.be/dQw4w9WgXcQ"],
      },
      { ref: "Load link", action: "press" },
    ],
  });
  expect(load.ok, load.error?.message).toBe(true);
  expect(spy.onLink).toHaveBeenCalledWith("dQw4w9WgXcQ");
});

test("the tape deck shows the album on its label and the J-card", () => {
  deck("tape");
  expect(screen.getByText(ALBUMS[0].title)).toBeTruthy();
  expect(
    screen.getByRole("list", { name: "Track list" }).textContent,
  ).toContain("Side A opener");
  expect(
    screen.getByRole("button", { name: "Pause" }).hasAttribute("disabled"),
  ).toBe(true);
  expect(
    screen.getByRole("button", { name: "Stop" }).hasAttribute("disabled"),
  ).toBe(true);
  expect(
    screen.getByRole("button", { name: "Play" }).hasAttribute("disabled"),
  ).toBe(false);
});

test("with no linked video the deck asks for a link and Play is off", () => {
  deck("tape", []);
  expect(
    screen.getByRole("button", { name: "Play" }).hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.getByLabelText("YouTube link")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Load link" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("the desktop skin's PL button hides and shows the playlist from the keyboard", async () => {
  const user = userEvent.setup();
  deck("desktop");
  const pl = screen.getByRole("button", { name: "Track list" });
  expect(pl.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Side A opener")).toBeTruthy();
  pl.focus();
  await user.keyboard(" ");
  expect(pl.getAttribute("aria-pressed")).toBe("false");
  expect(screen.queryByText("Side A opener")).toBeNull();
  await user.keyboard("{Enter}");
  expect(screen.getByText("Side A opener")).toBeTruthy();
});

test("arrow keys move between skins", async () => {
  const user = userEvent.setup();
  const spy = deck("tape");
  screen.getByRole("radio", { name: "Tape deck" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(spy.onSkin).toHaveBeenLastCalledWith("desktop");
});
