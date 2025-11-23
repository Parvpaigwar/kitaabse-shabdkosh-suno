import { useEffect, useState } from "react";
import { getBookStatus, BookProcessingStatus } from "@/services/bookService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, Volume2 } from "lucide-react";

interface ProcessingStatusProps {
  bookId: number;
  onComplete?: () => void;
  pollInterval?: number; // milliseconds, default 5000 (5 seconds)
  autoStop?: boolean; // stop polling when completed, default true
}

export const ProcessingStatus = ({
  bookId,
  onComplete,
  pollInterval = 5000,
  autoStop = true,
}: ProcessingStatusProps) => {
  const [status, setStatus] = useState<BookProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await getBookStatus(bookId);
        if (response.status === 'PASS') {
          setStatus(response.data);
          setError(null);

          // Check if processing is complete
          if (response.data.processing_status === 'completed' || response.data.processing_status === 'failed') {
            if (autoStop && intervalId) {
              clearInterval(intervalId);
            }
            if (response.data.processing_status === 'completed' && onComplete) {
              onComplete();
            }
          }
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling
    intervalId = setInterval(fetchStatus, pollInterval);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [bookId, pollInterval, autoStop, onComplete]);

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusBadge = () => {
    switch (status.processing_status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'uploaded':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Queued
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status.processing_status}</Badge>;
    }
  };

  const totalPages = status.total_pages;
  const completedPages = status.pages_status.completed;
  const processingPages = status.pages_status.processing;
  const failedPages = status.pages_status.failed;
  const pendingPages = status.pages_status.pending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg line-clamp-1">{status.title}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{status.processing_progress}%</span>
          </div>
          <Progress value={status.processing_progress} className="h-2" />
        </div>

        {/* Page Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <FileText className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">{totalPages}</div>
              <div className="text-xs text-muted-foreground">Total Pages</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-green-700">{completedPages}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          {processingPages > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-700">{processingPages}</div>
                <div className="text-xs text-muted-foreground">Processing</div>
              </div>
            </div>
          )}

          {pendingPages > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-700">{pendingPages}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          )}

          {failedPages > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium text-red-700">{failedPages}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}
        </div>

        {/* Audio Generation Status */}
        {status.audio_ready ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
            <Volume2 className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-green-700">Audio Ready</div>
              <div className="text-xs text-muted-foreground">
                {status.pages_with_audio} / {totalPages} pages with audio
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
            <Volume2 className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium text-blue-700">Generating Audio</div>
              <div className="text-xs text-muted-foreground">
                {status.pages_with_audio} / {totalPages} pages with audio
              </div>
            </div>
          </div>
        )}

        {/* Time Estimate */}
        {status.processing_status === 'processing' && status.estimated_time_remaining && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated time remaining: {status.estimated_time_remaining}</span>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(status.last_updated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};
