import React from "react";
import { SongRequest, Status } from "../../../types/schema";

interface RequestModalContentProps {
  request: SongRequest;
}

const SongRequestModalContent: React.FC<RequestModalContentProps> = ({
  request,
}) => {
  const getStatusText = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return "대기";
      case Status.FAILED:
        return "실패";
      default:
        return status;
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-xl font-semibold mb-4">노래 요청 정보</h2>
      <div className="space-y-3">
        <div>
          <p className="text-neutral-400 text-sm">곡 제목</p>
          <p className="text-lg">{request.songTitle}</p>
        </div>
        <div>
          <p className="text-neutral-400 text-sm">아티스트</p>
          <p className="text-lg">{request.artistName}</p>
        </div>
        <div>
          <p className="text-neutral-400 text-sm">요청 시간</p>
          <p>{new Date(request.requestAt.seconds * 1000).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-neutral-400 text-sm">상태</p>
          <span
            className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${
              request.status === Status.PENDING
                ? "bg-yellow-400/10 text-yellow-400"
                : "bg-red-400/10 text-red-400"
            }`}
          >
            {getStatusText(request.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SongRequestModalContent;
