import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import App from "../App";
import { ALBUMS } from "../data/albums";
import { skinFor, themeFor } from "../theme";

test("tape for the '70s–'90s rooms, the desktop player for the 2000s", () => {
  for (const a of ALBUMS)
    expect(skinFor(a), a.id).toBe(themeFor(a) === "y2k" ? "desktop" : "tape");
  expect(ALBUMS.some((a) => skinFor(a) === "tape")).toBe(true);
  expect(ALBUMS.some((a) => skinFor(a) === "desktop")).toBe(true);
});

const skinOf = () => document.querySelector(".amp")?.getAttribute("data-skin");
const openAlbum = async (id: string) => {
  history.pushState(null, "", `/album/${id}/`);
  await act(async () => dispatchEvent(new PopStateEvent("popstate")));
  await screen.findByRole("radio", { name: "Tape deck" });
};

test("the player follows the album, and a hand-picked skin holds for that album", async () => {
  localStorage.clear();
  const user = userEvent.setup();
  const old = ALBUMS.find((a) => skinFor(a) === "tape")!;
  const recent = ALBUMS.find((a) => skinFor(a) === "desktop")!;
  render(<App />);

  await openAlbum(old.id);
  expect(skinOf()).toBe("tape");
  await openAlbum(recent.id);
  await act(async () => {});
  expect(skinOf()).toBe("desktop");

  await user.click(screen.getByRole("radio", { name: "Tape deck" }));
  expect(skinOf()).toBe("tape");
  await openAlbum(old.id);
  expect(skinOf()).toBe("tape");
  await openAlbum(recent.id);
  expect(skinOf()).toBe("tape");
  const other = ALBUMS.find(
    (a) => skinFor(a) === "desktop" && a.id !== recent.id,
  )!;
  await openAlbum(other.id);
  expect(skinOf()).toBe("desktop");
});
