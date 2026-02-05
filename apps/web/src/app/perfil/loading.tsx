import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerfilLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
            {/* Profile Header Skeleton */}
            <Card className="mb-8 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 animate-pulse" />
                <CardContent className="relative pt-0 pb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-10">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="text-center sm:text-left flex-1 space-y-2">
                            <Skeleton className="h-7 w-40" />
                            <Skeleton className="h-5 w-56" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardContent>
            </Card>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-12" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions Skeleton */}
            <Card className="mb-8">
                <CardHeader>
                    <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent className="p-0">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-5 w-5" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
