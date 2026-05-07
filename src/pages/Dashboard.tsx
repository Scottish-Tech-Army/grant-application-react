import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Stack,
  Grid,
  CircularProgress,
  Alert
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from "../api/dashboardApi";

 // ✅ Replace later with auth context
 const tenantId = "0eadf87c-fe41-4a62-bb79-3eebdd37be70";
 const userId = "42391438-f47c-47f1-a4b7-c1078a8a7ccf";


export interface statCardProps{
  label: string;
  value: number;
  hint: string;
}

function StatCard({ label, value , hint }: statCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData({ tenantId, userId });
        if (mounted) 
          setDashboard(data);
      } catch (err) {
        console.error(err);
        if (mounted) 
          setError("Failed to load dashboard data");
      } finally {
        if (mounted) 
          setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [tenantId, userId]);

  /* -------------------- states -------------------- */

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ mt: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        {error}
      </Alert>
    );
  }
  
  const {
    total,
    drafted,
    submitted,
    recentApplications = [],
  } = dashboard;

  //const navigate = useNavigate();
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Applications" value={total} hint="All-time across funders" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Drafts" value={drafted} hint="Work in progress" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Submitted" value={submitted} hint="Sent to funders" />
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Recent Grant Applications
                </Typography>
                <Button size="small" onClick={() => navigate("/grant-applications")}>View all</Button>
              </Stack>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "text.secondary" }}>Application</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Funder</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Status</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentApplications.map((r) => (
                    <TableRow key={r.applicationId} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell>
                      <TableCell>{r.funderName}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.status}
                          size="small"
                          color={r.status === "Submitted" ? "success" : "primary"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{r.createdAt.toString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Tip: Keep drafts updated so exports reflect your latest work.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}