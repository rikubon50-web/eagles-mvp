"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "./actions";

export default function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm("この記事を削除しますか？この操作は取り消せません。")) return;
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.ok) {
        router.refresh();
      } else {
        window.alert(result.error ?? "削除に失敗しました");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-red-600 underline disabled:opacity-50"
    >
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
