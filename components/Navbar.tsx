export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-10 py-6">
      <h1 className="text-5xl font-bold text-[#f3ead7]">The Owensboro App</h1>
      <button className="text-2xl text-[#f3ead7] cursor-pointer">Logout</button>
    </header>
  );
}