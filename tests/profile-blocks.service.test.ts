import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  profileFindUnique: vi.fn(),
  layoutFindMany: vi.fn(),
  layoutFindUnique: vi.fn(),
  layoutCreateMany: vi.fn(),
  layoutUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    businessProfile: { findUnique: mocks.profileFindUnique },
    profileBlockLayout: {
      findMany: mocks.layoutFindMany,
      findUnique: mocks.layoutFindUnique,
      createMany: mocks.layoutCreateMany,
      update: mocks.layoutUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

import {
  BlockNotFoundError,
  BlockOperationNotAllowedError,
  getResolvedBlockLayout,
  reorderBlockLayout,
  setBlockVisibility,
} from "@/lib/services/profile-blocks";
import { SYSTEM_BLOCK_ORDER } from "@/lib/blocks/registry";

const availability = Object.fromEntries(SYSTEM_BLOCK_ORDER.map((key) => [key, true])) as Record<
  (typeof SYSTEM_BLOCK_ORDER)[number],
  boolean
>;

const rows = SYSTEM_BLOCK_ORDER.map((blockKey, position) => ({
  id: `block-${position}`,
  businessProfileId: "profile-1",
  blockKey,
  position,
  isVisible: true,
  config: null,
}));

describe("profile block service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.profileFindUnique.mockResolvedValue({ id: "profile-1" });
    mocks.layoutCreateMany.mockResolvedValue({ count: 7 });
    mocks.layoutUpdate.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, ...data })
    );
    mocks.transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations)
    );
  });

  it("initializes all seven missing system blocks with skipDuplicates", async () => {
    mocks.layoutFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce(rows);

    const result = await getResolvedBlockLayout("org-1", availability);

    expect(result).toHaveLength(7);
    expect(mocks.layoutCreateMany).toHaveBeenCalledWith({
      data: SYSTEM_BLOCK_ORDER.map((blockKey) =>
        expect.objectContaining({ businessProfileId: "profile-1", blockKey })
      ),
      skipDuplicates: true,
    });
  });

  it("is idempotent when all system blocks already exist", async () => {
    mocks.layoutFindMany
      .mockResolvedValueOnce(rows.map(({ blockKey }) => ({ blockKey })))
      .mockResolvedValueOnce(rows);

    await getResolvedBlockLayout("org-1", availability);

    expect(mocks.layoutCreateMany).not.toHaveBeenCalled();
  });

  it("updates visibility only for an owned block row", async () => {
    mocks.layoutFindUnique.mockResolvedValue(rows[0]);

    await setBlockVisibility("org-1", rows[0].id, false);

    expect(mocks.layoutUpdate).toHaveBeenCalledWith({
      where: { id: rows[0].id },
      data: { isVisible: false },
    });
  });

  it("rejects visibility changes for an unowned block row", async () => {
    mocks.layoutFindUnique.mockResolvedValue({ ...rows[0], businessProfileId: "profile-2" });
    await expect(setBlockVisibility("org-1", rows[0].id, false)).rejects.toBeInstanceOf(
      BlockNotFoundError
    );
  });

  async function reorder(ids: string[]) {
    mocks.layoutFindMany
      .mockResolvedValueOnce(rows.map(({ blockKey }) => ({ blockKey })))
      .mockResolvedValueOnce(rows.map(({ id }) => ({ id })));
    return reorderBlockLayout("org-1", ids);
  }

  it("persists a valid full row-id reorder", async () => {
    const reversed = rows.map((row) => row.id).reverse();
    await reorder(reversed);
    expect(mocks.layoutUpdate).toHaveBeenCalledTimes(7);
    expect(mocks.layoutUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: reversed[0] },
      data: { position: 0 },
    });
  });

  it("rejects duplicate row IDs", async () => {
    const ids = rows.map((row) => row.id);
    ids[6] = ids[0];
    await expect(reorder(ids)).rejects.toBeInstanceOf(BlockOperationNotAllowedError);
  });

  it("rejects missing row IDs", async () => {
    await expect(reorder(rows.slice(0, 6).map((row) => row.id))).rejects.toBeInstanceOf(
      BlockOperationNotAllowedError
    );
  });

  it("rejects foreign row IDs", async () => {
    const ids = rows.map((row) => row.id);
    ids[6] = "foreign-block";
    await expect(reorder(ids)).rejects.toBeInstanceOf(BlockOperationNotAllowedError);
  });
});
