import { useEffect, useMemo, useState } from "react";
import { apiKeyService, ApiKey } from "@/services/apiKeyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppTranslation } from "@/i18n";

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const { t } = useAppTranslation();

  const loadKeys = async () => {
    try {
      const data = await apiKeyService.list();
      setKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const key = await apiKeyService.create(name);
      setKeys((prev) => [...prev, key]);
      setName("");
    } catch (error) {
      console.error("Error creating API key:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiKeyService.remove(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const isCreateDisabled = useMemo(
    () => name.trim().length === 0,
    [name]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.api_keys.placeholder")}
        />
        <Button onClick={handleCreate} disabled={isCreateDisabled}>
          {t("settings.api_keys.create")}
        </Button>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.api_keys.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between rounded border p-2"
            >
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="break-all text-sm text-muted-foreground">
                  {k.key}
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => handleDelete(k.id)}
              >
                {t("common.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
