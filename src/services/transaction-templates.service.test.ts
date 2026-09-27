import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from "./transaction-templates.service"
import { supabase } from "./supabase"

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe("transaction-templates.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTemplates", () => {
    it("fetches templates for user with proper joins and ordering", async () => {
      const mockData = [
        {
          id: "tpl-1",
          name: "Makan Siang",
          type: "expense",
          amount: 35000,
          description: "Makan siang kantor",
          tags: ["#makan"],
          account_id: "acc-1",
          category_id: "cat-1",
          sort_order: 0,
          accounts: { name: "BCA", icon: "wallet", color: "#9AB17A" },
          categories: { name: "Makanan", icon: "🍽", color: "#E27D60" },
        },
      ]

      const orderSecond = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const orderFirst = vi.fn().mockReturnValue({ order: orderSecond })
      const eqMock = vi.fn().mockReturnValue({ order: orderFirst })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as never)

      const result = await getTemplates("user-123")

      expect(supabase.from).toHaveBeenCalledWith("transaction_templates")
      expect(selectMock).toHaveBeenCalledWith(
        "id,name,type,amount,description,tags,account_id,category_id,sort_order,accounts(name,icon,color),categories(name,icon,color)"
      )
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-123")
      expect(orderFirst).toHaveBeenCalledWith("sort_order", { ascending: true })
      expect(orderSecond).toHaveBeenCalledWith("created_at", { ascending: false })
      expect(result).toEqual(mockData)
    })

    it("returns empty array if data is null", async () => {
      const orderSecond = vi.fn().mockResolvedValue({ data: null, error: null })
      const orderFirst = vi.fn().mockReturnValue({ order: orderSecond })
      const eqMock = vi.fn().mockReturnValue({ order: orderFirst })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as never)

      const result = await getTemplates("user-123")
      expect(result).toEqual([])
    })

    it("throws error when Supabase query fails", async () => {
      const dbError = new Error("Database error")
      const orderSecond = vi.fn().mockResolvedValue({ data: null, error: dbError })
      const orderFirst = vi.fn().mockReturnValue({ order: orderSecond })
      const eqMock = vi.fn().mockReturnValue({ order: orderFirst })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as never)

      await expect(getTemplates("user-123")).rejects.toThrow("Database error")
    })
  })

  describe("createTemplate", () => {
    it("inserts template and returns id", async () => {
      const input: CreateTemplateInput = {
        user_id: "user-123",
        name: "Kopi",
        type: "expense",
        account_id: "acc-1",
        category_id: "cat-1",
        amount: 25000,
        description: "Kopi pagi",
        tags: ["#kopi"],
      }

      const singleMock = vi.fn().mockResolvedValue({ data: { id: "tpl-created-id" }, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never)

      const result = await createTemplate(input)

      expect(supabase.from).toHaveBeenCalledWith("transaction_templates")
      expect(insertMock).toHaveBeenCalledWith(input)
      expect(selectMock).toHaveBeenCalledWith("id")
      expect(result).toEqual({ id: "tpl-created-id" })
    })

    it("throws error if insert fails", async () => {
      const input: CreateTemplateInput = {
        user_id: "user-123",
        name: "Kopi",
        type: "expense",
      }

      const singleMock = vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never)

      await expect(createTemplate(input)).rejects.toThrow("Insert failed")
    })

    it("throws error if data.id is missing", async () => {
      const input: CreateTemplateInput = {
        user_id: "user-123",
        name: "Kopi",
        type: "expense",
      }

      const singleMock = vi.fn().mockResolvedValue({ data: {}, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never)

      await expect(createTemplate(input)).rejects.toThrow("Gagal menyimpan template.")
    })
  })

  describe("deleteTemplate", () => {
    it("deletes template with user_id and templateId", async () => {
      const eqSecond = vi.fn().mockResolvedValue({ error: null })
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqFirst })

      vi.mocked(supabase.from).mockReturnValue({
        delete: deleteMock,
      } as never)

      await deleteTemplate("user-123", "tpl-1")

      expect(supabase.from).toHaveBeenCalledWith("transaction_templates")
      expect(deleteMock).toHaveBeenCalled()
      expect(eqFirst).toHaveBeenCalledWith("user_id", "user-123")
      expect(eqSecond).toHaveBeenCalledWith("id", "tpl-1")
    })

    it("throws error if delete fails", async () => {
      const eqSecond = vi.fn().mockResolvedValue({ error: new Error("Delete failed") })
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqFirst })

      vi.mocked(supabase.from).mockReturnValue({
        delete: deleteMock,
      } as never)

      await expect(deleteTemplate("user-123", "tpl-1")).rejects.toThrow("Delete failed")
    })
  })

  describe("updateTemplate", () => {
    it("updates template with matching user_id and id", async () => {
      const input: UpdateTemplateInput = {
        id: "tpl-1",
        user_id: "user-123",
        name: "Makan Malam",
        amount: 45000,
      }

      const eqSecond = vi.fn().mockResolvedValue({ error: null })
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond })
      const updateMock = vi.fn().mockReturnValue({ eq: eqFirst })

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as never)

      await updateTemplate(input)

      expect(supabase.from).toHaveBeenCalledWith("transaction_templates")
      expect(updateMock).toHaveBeenCalledWith({
        name: "Makan Malam",
        amount: 45000,
      })
      expect(eqFirst).toHaveBeenCalledWith("user_id", "user-123")
      expect(eqSecond).toHaveBeenCalledWith("id", "tpl-1")
    })

    it("throws error if update fails", async () => {
      const input: UpdateTemplateInput = {
        id: "tpl-1",
        user_id: "user-123",
        name: "Makan Malam",
      }

      const eqSecond = vi.fn().mockResolvedValue({ error: new Error("Update failed") })
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond })
      const updateMock = vi.fn().mockReturnValue({ eq: eqFirst })

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as never)

      await expect(updateTemplate(input)).rejects.toThrow("Update failed")
    })
  })
})
