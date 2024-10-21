import Link from "next/link";

export default function Home() {
  const chatRooms = [1, 2, 3, 4, 5];

  return (
    <div className="p-5 flex flex-col h-screen">
      <h1 className="text-center mb-5">Chat Rooms</h1>
      <ul className="list-disc pl-5 flex-1">
        {chatRooms.map((roomId) => (
          <li key={roomId}>
            <Link href={`/chat/${roomId}`}>Chat Room {roomId}</Link>
          </li>
        ))}
      </ul>
      <button className="w-10 h-10 border border-gray-50 rounded-3xl text-lg">
        +
      </button>
    </div>
  );
}
