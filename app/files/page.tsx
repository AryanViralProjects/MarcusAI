"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FilesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">File Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>File Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            File management is handled by the Marcus AI team. Files are uploaded and managed through the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 