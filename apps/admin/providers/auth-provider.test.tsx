import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./auth-provider";
import { getMe, logout as logoutRequest } from "@/lib/api/routes/auth";
import { ApiError } from "@/lib/api/client";

vi.mock("@/lib/api/routes/auth", () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

const fakeUser = {
  id: "1",
  name: "Gael",
  role: "ADMIN",
  email: "gael@swiftgoma.com",
  isEmailVerified: true,
  hasPassword: true,
  twoFactorEnabled: false,
  isBlocked: false,
};

function TestConsumer() {
  const { user, isLoading, isAuthenticated, connectionError, logout } =
    useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="connection-error">{String(connectionError)}</span>
      <span data-testid="user-name">{user?.name ?? "none"}</span>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts loading, then resolves with the user on success", async () => {
    vi.mocked(getMe).mockResolvedValue(fakeUser);

    renderWithProvider();

    expect(screen.getByTestId("loading").textContent).toBe("true");

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false"),
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user-name").textContent).toBe("Gael");
    expect(screen.getByTestId("connection-error").textContent).toBe("false");
  });

  it("treats a real 401 (ApiError) as 'not logged in' — not a connection error", async () => {
    vi.mocked(getMe).mockRejectedValue(
      new ApiError(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
            details: null,
            requestId: "abc",
          },
        },
        401,
      ),
    );

    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false"),
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user-name").textContent).toBe("none");
    expect(screen.getByTestId("connection-error").textContent).toBe("false");
  });

  it("treats a network error (no HTTP response at all) as a connection error", async () => {
    const networkError = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      response: undefined,
    });
    vi.mocked(getMe).mockRejectedValue(networkError);

    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false"),
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("connection-error").textContent).toBe("true");
  });

  it("logout clears the user and calls the logout endpoint", async () => {
    vi.mocked(getMe).mockResolvedValue(fakeUser);
    vi.mocked(logoutRequest).mockResolvedValue({
      message: "Déconnexion réussie.",
    });

    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("true"),
    );

    await user.click(screen.getByText("Logout"));

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("false"),
    );
    expect(logoutRequest).toHaveBeenCalledTimes(1);
  });

  it("still clears local user state even if the logout API call fails", async () => {
    vi.mocked(getMe).mockResolvedValue(fakeUser);
    vi.mocked(logoutRequest).mockRejectedValue(new Error("network blip"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("true"),
    );

    await user.click(screen.getByText("Logout"));

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("false"),
    );

    consoleSpy.mockRestore();
  });

  it("useAuth throws when used outside an AuthProvider", () => {
    function Bare() {
      useAuth();
      return null;
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Bare />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    consoleSpy.mockRestore();
  });
});
