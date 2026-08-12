import { BlogPostForm } from "@/components/forms/blog-post-form";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Nouvel article</h1>
      <BlogPostForm />
    </div>
  );
}
