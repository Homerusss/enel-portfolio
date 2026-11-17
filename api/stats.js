// Vercel serverless function: GET /api/stats
// Reads Steal An Egg From Caves' live stats and pictures from Roblox.
// Roblox blocks browsers from calling its API directly, so the page asks this function instead.
var UNIVERSE_ID = "10775903922";

async function getJson(url) {
  var r = await fetch(url);
  if (!r.ok) throw new Error("Roblox answered " + r.status);
  return r.json();
}

module.exports = async function (req, res) {
  try {
    var results = await Promise.all([
      getJson("https://games.roblox.com/v1/games?universeIds=" + UNIVERSE_ID),
      getJson("https://thumbnails.roblox.com/v1/games/icons?universeIds=" + UNIVERSE_ID + "&size=150x150&format=Png&isCircular=false").catch(function () { return null; }),
      getJson("https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=" + UNIVERSE_ID + "&countPerUniverse=1&size=768x432&format=Png").catch(function () { return null; })
    ]);
    var games = results[0], icons = results[1], thumbs = results[2];
    var game = games.data && games.data[0];
    if (!game) throw new Error("Game not found");
    var icon = icons && icons.data && icons.data[0] && icons.data[0].imageUrl;
    var thumb = thumbs && thumbs.data && thumbs.data[0] && thumbs.data[0].thumbnails && thumbs.data[0].thumbnails[0];
    // Vercel caches the answer for 60 seconds, so Roblox isn't called on every visit.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({
      name: game.name,
      visits: game.visits,
      playing: game.playing,
      favorites: game.favoritedCount,
      icon: icon || null,
      thumbnail: (thumb && thumb.imageUrl) || null
    });
  } catch (err) {
    res.status(502).json({ error: "Stats unavailable" });
  }
};
