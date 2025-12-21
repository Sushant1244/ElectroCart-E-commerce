import React from 'react';

export default function Blog(){
  return (
    <div className="container" role="main">
      <h1>Blog</h1>
      <p>Latest news and events will appear here.</p>
      <article className="blog-list">
        <section className="blog-card">
          <h2>Welcome to the Elecrocart Blog</h2>
          <p>This is a demo article. Replace with your CMS or API content when ready.</p>
        </section>
      </article>
    </div>
  );
}
