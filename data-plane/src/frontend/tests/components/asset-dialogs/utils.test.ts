/**
 * Tests for components/asset-dialogs/utils.ts
 */

import { extractData } from "@/components/apps/assets/pages/detail/dialogs/utils";

describe("extractData", () => {
  it("should return empty array when data is undefined", () => {
    expect(extractData(undefined)).toEqual([]);
  });

  it("should return array when data is already an array", () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(extractData(data)).toEqual(data);
  });

  it("should extract results from paginated response", () => {
    const data = { results: [{ id: 1 }, { id: 2 }] };
    expect(extractData(data)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("should return empty array when results is empty", () => {
    const data = { results: [] };
    expect(extractData(data)).toEqual([]);
  });

  it("should handle null results property", () => {
    const data: any = { results: null };
    expect(extractData(data)).toEqual([]);
  });
});



