import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage general settings for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>General settings options will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
