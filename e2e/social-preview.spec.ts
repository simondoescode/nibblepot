import {test,expect} from '@playwright/test';
for(const route of ['', 'plan/', 'planner/', 'shopping/', 'recipes/speedy-tomato-pasta/']){
  test(`static share metadata is readable without JavaScript: ${route||'home'}`,async({request})=>{
    const response=await request.get('/nibblepot/'+route);
    expect(response.ok()).toBe(true);
    const html=await response.text();
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html.match(/property="og:image"/g)).toHaveLength(1);
    expect(html).toContain('property="og:site_name" content="Simmer"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    const image=html.match(/property="og:image" content="([^"]+)"/)![1];
    expect(image).toMatch(/^https:\/\/simondoescode.github.io\/nibblepot\//);
    const asset=await request.get(new URL(image).pathname);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()['content-type']).toMatch(/image\//);
    const card=route.startsWith('recipes')?'recipe':(route.startsWith('planner')||route.startsWith('plan'))?'meal-plan':route.startsWith('shopping')?'shopping':'general';
    expect(image).toContain(`social/simmer-${card}-og.jpg`);
    expect(html).toContain('property="og:image:width" content="1200"');
    const bytes=await asset.body();
    expect(bytes.length).toBeLessThan(250000);
    expect(bytes.length).toBeGreaterThan(10000);
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:secure_url" content="'+image+'"');
  });
}
