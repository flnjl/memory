# Memory
## Jeu Memory en mode web
- Au lancement du jeu les meilleurs temps s'affichent
- L'écran propose un plateau de cartes disposées faces cachées
- Le joeur doit cliquer sur deux cartes pour les retourner
- Si elles sont identiques, elles restent affichées
- Sinon au prochain choix de carte elles sont retournées face cachée
- Un compteur de temps est affiché
- Le joureur gagne si toutes les cartes sont trouvées avant la fin du temps imparti
- Les temps des gagnants sont enregistrés en base de données

## Installation
### Via git et Docker
```
git clone https://github.com/flnjl/memory.git
cd memory
docker build -t memory .
docker run -d --name memory_container -p 8080:80 memory
xdg-open http://localhost:8080
```

### Via fichier Zip
- Télécharger le fichier depuis le compte Github
- Le décompresser
- Exécuter le serveur PHP : `php -S 127.0.0.1:8080` depuis le répertoire
- Lancer le navigateur à l'adresse 127.0.0.1:8080

## Description technique
### Interface utilisateur
L'interface est affichée  par la page `index.html` et le fichier de styles `ressources/css/styles.css` (générable via `ressources/sass/styles.sass`).

Le jeu est géré en javascript via le fichier `ressources/js/app.js`. Le plateau avec la disposition des cartes est affiché par le javascript.

Les images des cartes sont une image sous forme de sprites dans le répertoire `ressources/img`.

### Fonctionnement
- HTML 
  - affiche la page de base avec les éléments conteneurs du jeu
  - appelle les styles et le javascript
- Javascript 
  - tire les cartes de façon aléatoire (on affiche moins de cartes que ce que le sprite propose) et les ordonne de façon aléatoire
  - il crée les éléments HTML des cartes et les place sur le plateau (insertion dans le document HTML, DOM)
- CSS gère l'affichage de la grille
- Javascript
  - ajoute la gestion des évènements clic utilisateur sur les cartes
  - appelle le serveur pour récupérer les meilleurs temps des parties déjà effectuées
 - Le serveur PHP (fichier `serveur.php`)
   - réceptionne la requête `GET`
   - initialise la base de données SQLite si elle n'existe pas
   - retourne la liste des meilleurs temps
- Javascript
  - affiche les meilleurs temps
  - lance la partie lorsque l'utilisateur clic sur le bouton OK (lancement du minuteur)
  - la partie est gérée entre la gestion des évènements clic sur les cartes et le minuteur
- CSS gère l'affichage des cartes : cartes cachées, retournées, trouvées
- En fin de partie, Javascript
  - si toutes les cartes sont retournées, appelle le serveur PHP pour enregistrer le temps
  - affichage d'un message Gagné / Perdu avec proposition de relancer le jeu

### Notes
Utilisation d'un HTML simple.

Le CSS est générable depuis un fichier Sass simple également. Il montre différentes possibilités de CSS :
- mise en forme basique
- styles sur les éléments, les classes, les identifiants, les attributs
- mise en forme avancée (disposition de la grille, media-queries)
- utilisation de Sass pour la génération de code répétable
- utilisation des sprites

Le javascript n'utilise pas de bibliothèque externe. Il utilise la norme ES6. 

On peut voir dans le code les notions de :
- classe
- déclaration et portée des variables
- fonctions anonymes
- syntaxes consises (=>)
- évènements du DOM
- manipulation du DOM
- promesses (via fetch())
- utilisation de retours JSON

Le code PHP est composé de deux classes. La première permet de gérer la base de données, la seconde l'application.

La base de données utilisée est SQLite.

Le code PHP permet de voir les notions de :
- classes (constructeur, visibilités des méthodes, méthodes statiques...)
- chaînage de méthodes
- séparation des couches
- méthode / verbes HTTP, codes HTTP (200, 201...) et formats de retours (JSON)
- accès aux bases de données (utilisation de PDO)

L'ensemble du code peut évoluer pour appréhender :
- la gestion des erreurs (non géré ici)
- le développement d'applications sous forme d'API REST.
