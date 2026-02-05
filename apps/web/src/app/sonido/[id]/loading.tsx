import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SonidoLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 mt-20">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Back Link */}
                <Skeleton className="h-5 w-40 mb-6" />

                {/* Header Section */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                    </div>

                    {/* Title */}
                    <Skeleton className="h-12 w-3/4" />

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Player */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full rounded-xl mb-4" />
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Map */}
                    <div>
                        <Card className="overflow-hidden">
                            <Skeleton className="h-[300px] w-full" />
                            <CardContent className="p-4 space-y-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 flex-1" />
                                    <Skeleton className="h-9 flex-1" />
                                </div>
                                <div className="text-center">
                                    <Skeleton className="h-4 w-24 mx-auto mb-2" />
                                    <Skeleton className="h-4 w-40 mx-auto" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
