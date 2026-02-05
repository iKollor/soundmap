import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubirLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
                <Skeleton className="h-10 w-48 mx-auto mb-2" />
                <Skeleton className="h-5 w-72 mx-auto" />
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Upload Area */}
                    <Skeleton className="h-40 w-full rounded-lg" />

                    {/* Title Field */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    {/* Category & Environment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    {/* Map */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>

                    {/* Submit Button */}
                    <Skeleton className="h-11 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
