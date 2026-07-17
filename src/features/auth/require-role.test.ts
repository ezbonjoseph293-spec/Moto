import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const findUniqueMock = vi.fn();
const isRefreshTokenValidMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/tenancy", () => ({
  forPlatform: () => ({ user: { findUnique: findUniqueMock } }),
}));
vi.mock("./service", () => ({ isRefreshTokenValid: isRefreshTokenValidMock }));

const { requireRole } = await import("./require-role");

const ACTIVE_USER = {
  id: "user-1",
  email: "owner@dealer.example",
  name: "Owner Person",
  role: "OWNER" as const,
  dealershipId: "dealer-1",
  isActive: true,
};

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockClear();
  findUniqueMock.mockReset();
  isRefreshTokenValidMock.mockReset();
});

describe("requireRole", () => {
  it("redirects to /login when there is no session", async () => {
    authMock.mockResolvedValue(null);

    await expect(requireRole(["OWNER"])).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /login when the user has been deactivated", async () => {
    authMock.mockResolvedValue({ user: { id: ACTIVE_USER.id, rtid: "rt-1" } });
    findUniqueMock.mockResolvedValue({ ...ACTIVE_USER, isActive: false });
    isRefreshTokenValidMock.mockResolvedValue(true);

    await expect(requireRole(["OWNER"])).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /login when the session's refresh token has been revoked", async () => {
    authMock.mockResolvedValue({ user: { id: ACTIVE_USER.id, rtid: "rt-1" } });
    findUniqueMock.mockResolvedValue(ACTIVE_USER);
    isRefreshTokenValidMock.mockResolvedValue(false);

    await expect(requireRole(["OWNER"])).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /403 when the user's role isn't in the allowed list", async () => {
    authMock.mockResolvedValue({ user: { id: ACTIVE_USER.id, rtid: "rt-1" } });
    findUniqueMock.mockResolvedValue({ ...ACTIVE_USER, role: "SALES" });
    isRefreshTokenValidMock.mockResolvedValue(true);

    await expect(requireRole(["OWNER"])).rejects.toThrow("REDIRECT:/403");
  });

  it("returns the authenticated user when everything checks out", async () => {
    authMock.mockResolvedValue({ user: { id: ACTIVE_USER.id, rtid: "rt-1" } });
    findUniqueMock.mockResolvedValue(ACTIVE_USER);
    isRefreshTokenValidMock.mockResolvedValue(true);

    const result = await requireRole(["OWNER", "MANAGER"]);

    expect(result).toEqual({
      id: ACTIVE_USER.id,
      email: ACTIVE_USER.email,
      name: ACTIVE_USER.name,
      role: ACTIVE_USER.role,
      dealershipId: ACTIVE_USER.dealershipId,
    });
  });

  it("honors a custom redirectTo for the unauthenticated case", async () => {
    authMock.mockResolvedValue(null);

    await expect(requireRole(["OWNER"], { redirectTo: "/custom-login" })).rejects.toThrow(
      "REDIRECT:/custom-login",
    );
  });
});
