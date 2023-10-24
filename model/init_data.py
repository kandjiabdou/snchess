import os, json, time, random
from unidecode import unidecode


# def prim(graph, sommetDepart):
#     ACPM = []
#     visited = set()
#     G = nx.Graph()

#     visited.add(sommetDepart)
#     poids_total = 0

#     while len(visited) < len(graph):
#         poids_minimum = float('inf')
#         min_E = None

#         for sommet in visited:
#             for voisin, poids in graph[sommet]:
#                 if voisin not in visited and poids < poids_minimum:
#                     poids_minimum = poids
#                     min_E = (sommet, voisin) 
#         if min_E:
#             u, v = min_E
#             ACPM.append((u, v, poids_minimum))
#             G.add_edge(u, v, poids=poids_minimum)
#             visited.add(v)
#             poids_total += poids_minimum

#     return ACPM, G, poids_total

def get_sommet_position(file_name):
    positions = {}
    with open(file_name, "r", encoding = "utf8") as file:
        for ligne in file:
            ligne = unidecode(ligne).lower()
            station = ligne.strip().split(";")
            x, y, nom = station
            if not nom in positions :
                positions[nom] = [[int(x), int(y)]]
            else : positions[nom].append([int(x), int(y)])
    return positions

def get_graphe(file_name, pospoints):
    file_sommets = "sommets.json"
    if os.path.exists(file_sommets):
        with open(file_sommets, 'r', encoding = "utf8") as data_sommet_file:
            graphe = json.load(data_sommet_file)
            return graphe
    graphe = []
    with open(file_name, "r", encoding = "utf8") as file:
        for ligne in file:
            if ligne.startswith("V"):
                ligne = ligne[:2]+";"+ligne[2:6]+";"+ligne[6:len(ligne)-2]+";"+ligne[len(ligne)-2:]
                V = list(map(str.strip, ligne.split(";")))[1:]
                data_sommet = {"id":int(V[0]),"nom":V[1], "num_ligne": V[2], "is_terminus": V[3],"branchement":V[4], "voisins":{}}
                graphe.append(data_sommet)
                nom = unidecode(V[1]).lower()
                coordonne_sommet = pospoints[nom].pop(0)
                data_sommet["position"] = coordonne_sommet
                pospoints[nom].append(coordonne_sommet)

            elif ligne.startswith("E"):
                s1, s2, p = ligne.split()[1:]
                graphe[int(s1)]["voisins"][int(s2)] = int(p)
                graphe[int(s2)]["voisins"][int(s1)] = int(p)
                
    with open(file_sommets, 'w', encoding="utf8") as file_save_sommets:
        json.dump(graphe, file_save_sommets)
    return graphe

def bellmanFord(graphe, s):
    d_ = {v: float('inf') for v in range(len(graphe))}
    chemins = [[s] for v in graphe]
    d_[s] = 0
    L = [s]
    while L:
        t = L.pop()
        voisin_t = graphe[t]["voisins"]
        for k in voisin_t:
            k_ = int(k)
            if d_[k_] > d_[t] + voisin_t[k]:
                d_[k_] = d_[t] + voisin_t[k]
                L.append(k_)
                chemins[k_] = chemins[t]+[k_]
    return d_, chemins

def get_all_ppc(graphe):
    fichier_pcc = "ppc_graphe.json"
    if os.path.exists(fichier_pcc):
        with open(fichier_pcc, 'r') as data_json:
            data = json.load(data_json)
            return data["dict_pcc"], data["lignes"]
    liste_lignes_metros = {}
    dict_ppc = {str(i): {} for i in range(len(graphe))}
    for i in range(len(graphe)): 
        distances, chemins = bellmanFord(graphe, i)
        for j in range(i):
            dict_ppc[str(i)][str(j)] = {"distance":distances[j], "chemin":chemins[j]}
            brchmt_i, brchmt_j = int(graphe[i]['branchement']), int(graphe[j]['branchement'])
            numl_i, numl_j = graphe[i]['num_ligne'], graphe[j]['num_ligne']
            end_i, end_j = graphe[i]['is_terminus'], graphe[j]['is_terminus']
            if end_i == "True" and end_j == "True" and numl_i == numl_j and brchmt_i + brchmt_j != 3:
                if brchmt_i == 2 or brchmt_j == 2:
                    if not numl_i in liste_lignes_metros: liste_lignes_metros[numl_i] = {}
                    if not "2" in liste_lignes_metros[numl_i]:
                        liste_lignes_metros[numl_i]["2"] = chemins[j]
                elif brchmt_i == 1 or brchmt_j == 1:
                    if not numl_i in liste_lignes_metros: liste_lignes_metros[numl_i] = {}
                    if not "1" in liste_lignes_metros[numl_i]:
                        liste_lignes_metros[numl_i]["1"] = chemins[j]       
                else: liste_lignes_metros[graphe[i]['num_ligne']] = chemins[j]
    
    data = {"dict_pcc": dict_ppc, "lignes":liste_lignes_metros}
    with open(fichier_pcc, 'w') as data_json:
        json.dump(data, data_json)
    return dict_ppc, liste_lignes_metros


def get_chemin_info(chemin, graphe):
    res = []
    for arret in chemin:
        res.append((arret, graphe[int(arret)]['nom'], graphe[int(arret)]['num_ligne'], graphe[int(arret)]['branchement']))
    return res

def plus_court_chemin(depart, arrive, dict_ppc, graphe):
    res = {}
    if depart > arrive :
        res = dict_ppc[str(depart)][str(arrive)]
    else:
        res = dict_ppc[str(arrive)][str(depart)]
        res["chemin"] = res["chemin"][::-1]
    res['chemin'] = get_chemin_info(res["chemin"], graphe) 
    return res

def get_direction(depart, arrive , liste_lignes_metros, graphe):
    brchmt_d, brchmt_a = int(graphe[depart]['branchement']), int(graphe[arrive]['branchement'])
    if graphe[depart]['num_ligne'] != graphe[arrive]['num_ligne'] or brchmt_d + brchmt_a == 3: return False
    num_ligne = graphe[depart]['num_ligne']
    if brchmt_d == 1 or brchmt_a == 1: chemin = liste_lignes_metros[num_ligne]["1"]
    elif brchmt_d == 2 or brchmt_a == 2: chemin = liste_lignes_metros[num_ligne]["2"]
    elif type(liste_lignes_metros[num_ligne]) is dict and brchmt_d == 0 and brchmt_a == 0:
        chemin = liste_lignes_metros[num_ligne][random.choice(["1", "2"])]
    else: chemin = liste_lignes_metros[num_ligne]
    for s in chemin:
        if s == depart: return graphe[chemin[len(chemin)-1]]["nom"]
        if s == arrive: return graphe[chemin[0]]["nom"]
    return False

temps_debut = time.time()

positions = get_sommet_position("pospoints.txt")
metro_file = "metro.txt"
graphe = get_graphe(metro_file, positions)
dict_ppc, lignes = get_all_ppc(graphe)

# depart = 0
# arrive = 1
# print(plus_court_chemin(depart,arrive, dict_ppc, graphe))

# print("Direction :",get_direction(depart,arrive, lignes, graphe))

# for l in lignes:
#     print(l,':',lignes[l])
# print(len(lignes))
temps_fin = time.time()
print(f"Temps d'exécution : {temps_fin - temps_debut} secondes")