import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Building,
  TrendingUp,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
} from "lucide-react";
import type { Brand } from "@shared/schema";

export default function CRMAnalytics() {
  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CRM Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Manage brand relationships and track partnership performance
          </p>
        </div>
        <Button className="rounded-full gap-2">
          <UserPlus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brands.length}</p>
                <p className="text-sm text-muted-foreground">Active Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Partnership Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Brand Partners</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search brands..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3">
                    Brand
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Videos</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building className="h-8 w-8 opacity-50" />
                      <p>No brand partners yet</p>
                      <p className="text-sm">Start featuring brands in your videos to build partnerships</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Building className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{brand.name}</p>
                          {brand.website && (
                            <p className="text-xs text-muted-foreground">{brand.website}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand.category ? (
                        <Badge variant="secondary">{brand.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {brand.prContactEmail || "-"}
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>$0</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={brand.isActive ? "bg-green-500/20 text-green-600" : ""}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
