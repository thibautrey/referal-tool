import { api } from "./api";

export async function getMetadata(url: string) {
  try {
    const response = await api.get<{
      title: string | null;
      description: string | null;
      image: string | null;
    }>(`/metadata?url=${encodeURIComponent(url)}`);

    return response.data;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}
