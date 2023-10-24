function getGraphe(file_name) {
    var graphe = [];
    var fs = require('fs');
    var data = fs.readFileSync(file_name, 'utf8');
    var lines = data.split('\n');
    
    lines.forEach((ligne) => {
        if (ligne.startsWith("V")) {
            var V = ligne.split(';').map(function(s) { return s.trim(); }).slice(1);
            var data_sommet = { "nom": V[1], "num_ligne": V[2], "is_terminus": V[3], "branchement": V[4], "voisins": {}};
            graphe.push(data_sommet);
        } else if (ligne.startsWith("E")) {
            var parts = ligne.split(' ');
            const s1 = parseInt(parts[1]), s2 = parseInt(parts[2]), p = parseInt(parts[3]);
            graphe[s1]["voisins"][s2] = p, graphe[s2]["voisins"][s1] = p;
        }
    });
    return graphe;
}

// function bellmanFord(graphe, s) {
//     const d = new Array(graphe.length).fill(Infinity);
//     const chemins = Array.from({ length: graphe.length }, (_, i) => [s]);
//     d[s] = 0;
//     const L = [s];
//     while (L.length) {
//         const t = L.pop();
//         const voisinT = graphe[t].voisins;
//         for (const k in voisinT) {
//             if (d[k] > d[t] + voisinT[k]) {
//                 d[k] = d[t] + voisinT[k];
//                 L.push(parseInt(k));
//                 chemins[k] = [...chemins[t], parseInt(k)];}}}
//     return [d, chemins];
// }


file_name = "metro.txt"
const graphe = getGraphe(file_name);
// console.log(graphe);
// const b = bellmanFord(graphe, 363);
// console.log(b);