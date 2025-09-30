export default function TweetCard({ text }: { text: string }) {
  return <article className="bg-white/5 rounded-xl p-4 border border-white/10 whitespace-pre-wrap">{text}</article>;
}
