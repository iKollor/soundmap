import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MisSonidosLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Sound List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center gap-4 p-4">
                                <Skeleton className="w-12 h-12 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9 rounded-md" />
                                    <Skeleton className="h-9 w-9 rounded-md" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
