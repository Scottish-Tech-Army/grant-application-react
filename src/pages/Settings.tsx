import { Card, CardContent, Typography } from "@mui/material";

export default function Settings() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure defaults such as export format and user profile.
        </Typography>
      </CardContent>
    </Card>
  );
}