/**
 * Classe de gestion du jeu memory.
 *
 * Principe de fonctionnement :
 * 	- le jeu comporte un plateau de x lignes et n colonnes (x * n = z cases)
 * 	- tirage aléatoire de z / 2 cartes (il faut des paires de cartes à retrouver)
 * 	- disposition aléatoire des cartes dans les cases
 * 	- création du code HTML du plateau
 * 	- association des cartes avec l'événement "click"
 * 		- gestion des actions lors du clic utilisateur sur une carte
 * 		- logique du jeu
 * 			- affichage d'une carte au clic
 * 			- deux cartes identiques à la suite : elles sont trouvées
 * 			- deux cartes différentes à la suite : elles sont à nouveau cachées
 * 			- toutes les cartes trouvées : c'est gagné
 * 	- lancement du chronomètre : quand le temps est dépassé, c'est perdu
 */
class Memory {
	
	/**
	 * Constructeur, est appelé à l'instanciation de l'objet.
	 * Permet d'initialiser les propriétés de l'objet.
	 */
	constructor() {
		this.nb_cartes = 18;   // nombre de cartes disponibles
		this.nb_lignes = 4;    // nombre de lignes dans le plateau de jeu
		this.nb_colonnes = 7;  // nombre de colonnes dans le plateau de jeu
		this.nb_cases = this.nb_lignes * this.nb_colonnes; // nombre de cases du plateau

		this.duree = 120;    // durée max d'une partie, en secondes

		this.barre_progression = document.getElementById('progress-bar'); // barre de progression
		this.barre_progression.setAttribute('max', this.duree); // on indique à la barre sa valeur maximum

		this.url_ws = '/serveur.php';	// url de lecture / écriture des temps en base de données

		this.init();
	}

	/**
	 * Initialise les propriétés propres à une nouvelle partie.
	 */
	init() {
		this.cartes = [];      // tableau qui contiendra les cartes disponibles sur le plateau

		this.nb_cartes_trouvees = 0;  // compteur de cartes trouvées dans une partie
		this.nb_cartes_affichees = 0; // compteur de cartes affichées lors des clics [0, 2]
		this.derniere_carte_affichee = null; // "pointeur" vers la dernière carte affichée
		
		this.temps_ecoule = 0; // temps écoulé dans la partie
		
		this.chrono = null;    // identifiant du chronomètre de la partie
		this.event_click_handler = null; // gestionnaire de l'évènement click

		this.barre_progression.setAttribute('value', this.temps_ecoule); // raz du temps écoulé
		this.barre_progression.labels[0].innerText = '';
	}

	/**
	 * Lance une nouvelle partie.
	 */
	debut() {
		this.init();

		this.afficherTemps();
		
		this.tirerCartes();
		this.creerPlateau();
		this.assignerEvenements();
		this.chronoDebut();
	}
	
	/**
	 * Tirage aléatoire des cartes et distribution sur le plateau.
	 * On va choisir les cartes de façon aléatoire dans la liste des cartes disponibles
	 * puis les disposer sur le plateau de façon aléatoire.
	 */
	tirerCartes() {	
		// tirage alétoire des cartes par paires
		while (this.cartes.length < this.nb_cases) {
			// on tire un numéro aléatoire  entre 0 et nombre de cartes
			let numero_carte = Math.floor(Math.random() * this.nb_cartes);
			// si le numéro n'est pas dans le tableau (on veut une seule paire par carte)
			if (!this.cartes.includes(numero_carte)) {
				// on ajoute la paire de cartes dans le tableau
				this.cartes.push(numero_carte, numero_carte);
			}
		}
		
		// disposition aléatoire des cartes
		// on va parcourir le tableau des cartes du dernier élément au premier
		// à chaque itération, on tire un numéro de carte et on permutera
		// la carte à la position tirée avec la carte à l'index de l'itération
		for (let index = this.cartes.length; index > 0 ; index--) {
			// tirage aléatoire d'un numéro carte
			let numero_carte = Math.floor(Math.random() * index);
			// on récupère la carte à l'index de l'itération
			let carte = this.cartes[index - 1];
			// place la carte tirée à la place de celle de l'index de l'itération
			this.cartes[index - 1] = this.cartes[numero_carte];
			// place la carte de l'index de l'itération à la place de celle au numéro tiré
			this.cartes[numero_carte] = carte;
		}
	}
	
	/**
	 * Création code HTML des cartes et insertion dans le plateau de jeu.
	 * Note : la disposition du plateau est gérée en CSS.
	 */
	creerPlateau() {
		let cartes_html = [];  // tableau qui contiendra les cartes HTML
		let ligne_html = [];   // tableau qui contiendra les lignes du plateau
		
		// parcours des cartes tirées pour créer les cartes et les mettre en ligne
		for (let index = 0; index < this.cartes.length; index++) {
			// une carte est une balise dev contenant une classe "carte" et un attribut 
			// "data-carte" qui contient le numéro de la carte
			let case_html = '<div class="carte" data-carte="' + this.cartes[index] + '"></div>';
			cartes_html.push(case_html);
		}
		
		document.getElementById('plateau').innerHTML = cartes_html.join('');
	}
	
	/**
	 * Assignement de l'évènement click aux cases du plateau.
	 */
	assignerEvenements() {
		let self = this; // self pointe vers l'instance courante de Memory

		// on assigne une fonction à une variable
		// cette fonction permet de gérer ce qui se passe lorsque
		// l'utilisateur clic sur une carte.
		// La méthode click de la classe gère l'action.
		this.event_click_handler = function(event) { self.click(event); }
		
		// récupération de toutes les cases par leur classe "carte"
		document.querySelectorAll('.carte').forEach(function(el) {
			// assignement de la méthode click à l'évènement "click"
			// dans ce bloc, this n'est pas disponible, d'où l'utilisation de self
			el.addEventListener('click', self.event_click_handler)
		})
	}
	
	/**
	 * Action réalisée lors d'un clic sur une case.
	 * Lors d'un clic sur une carte, on l'affiche.
	 * Si deux cartes sont affichées et qu'elles portent le même numéro, elles deviennent des cartes trouvées.
	 * Si deux cartes sont affichées lors du clic, elles sont cachées à nouveau.
	 * 
	 * @param event  Event  Objet contenant l'évènement.
	 */
	click(event) {
		let carte = event.target; // l'élément carte du DOM est disponible dans la propriété target de l'événement

		// si deux cartes sont affichées
		if (this.nb_cartes_affichees == 2) {
			// on cache les deux cartes affichées
			// l'expression el => el.classList... est une expression de fonction fléchée
			// c'est une expression courte équivalente function(el) { el.classList... }
			document.querySelectorAll('.affichee').forEach(el => el.classList.remove('affichee'));

			// on remet à zéro le nombre de cartes affichées et le pointeur vers la dernière carte
			this.nb_cartes_affichees = 0;
			this.derniere_carte_affichee = null;
		}

		// affichage de la carte qui vient d'être cliquée
		carte.classList.add('affichee');
		
		// récupération du numéro de carte par sont attribut "data-carte"
		let numero_carte = carte.getAttribute('data-carte');

		// si la dernière carte affichée et la carte actuelle ont le même numéro
		// mais ne sont pas les mêmes
		if (this.derniere_carte_affichee != null &&
			this.derniere_carte_affichee != carte &&
			numero_carte == this.derniere_carte_affichee.getAttribute('data-carte')) {
				
			// elle passent en classe "trouvee",
			// ne sont plus en classe "affichee"
			// et on supprime l'évènement click
			carte.classList.add('trouvee');
			carte.classList.remove('affichee');
			carte.removeEventListener('click', this.event_click_handler);
			
			this.derniere_carte_affichee.classList.add('trouvee');
			this.derniere_carte_affichee.classList.remove('affichee');
			this.derniere_carte_affichee.removeEventListener('click', this.event_click_handler);
			
			// on a trouvé deux nouvelles cartes
			this.nb_cartes_trouvees += 2;

			// si le nombre de cartes trouvée est égale au nombre de cases, c'est gagné !
			if (this.nb_cartes_trouvees == this.nb_cases) {
				this.finPartie();
			}
		}

		// on repart pour un tour : la dernière carte affichée est la carte qui vient d'être cliquée
		this.derniere_carte_affichee = carte;
		this.nb_cartes_affichees++;
	}

	/**
	 * Gestion de la fin de partie.
	 * On regarde si le joueur à gagné, on arrête le chronomètre et on désactive le clic sur les cartes.
	 */
	finPartie() {
		let self = this;
		// on peut affecter directement une booléen depuis une expression
		// ici gagne sera à true si le nombre de cartes trouvées est égale au nombre de cases
		let gagne = (this.nb_cartes_trouvees == this.nb_cases);
		
		this.chronoStop();

		// sélection des cartes qui ne sont pas trouvées pour supprimer l'évènement click
		// on retrouve ici la problématique de la portée de la variable this
		// et utilisation à nouveau d'une expression fléchée
		document.querySelectorAll('.carte:not(.trouvee)').forEach(el => el.removeEventListener('click', self.event_click_handler));

		if (gagne) {
			this.enregistrerTemps();
		}

		// on affiche le message gagné / perdu avec un délai de 10ms car certains navigateurs
		// basés sur Chrome affichent la boîte de message avant la mise à jour de la barre de progression
		setTimeout(function() {
			// gagne est un booléen. La syntaxe utilisée est équivalente à if (gagne) { ... } else { }
			let message = (gagne ? 'Bravo !!!\nVous avez gagné !' : 'Désolé...\n Vous avez perdu !') + '\n\nVoulez-vous rejouer ?';
			
			if (confirm(message)) {
				self.debut(); // si l'utilisateur veut rejouer, on relance une partie
			}
		}, 10);
	}

	/**
	 * Démarrage du chronomètre de la partie.
	 */
	chronoDebut() {
		let self = this; // this ne sera pas disponible dans la fonction de rappel utilisée par setInterval

		// toutes les secondes (1000 millisecondes) la fonction déclarée dans setInterval()
		// c'est une fonction anonyme. Elle enregistre le temps écoulé, appel la mise à jour de la
		// barre de progression et vérifie que le temps n'est pas terminé.
		// setInterval() retourne un identifiant, qui permettra d'arrêter le chronomètre.
		this.chrono = setInterval(function() {
			self.temps_ecoule++;
			self.progressBar();

			if (self.temps_ecoule == self.duree) {
				self.finPartie();
			}
			
		}, 1000);
	}

	/**
	 * Arrêt du chronomètre.
	 */
	chronoStop() {
		if (null != this.chrono) {
			clearInterval(this.chrono);
			this.chrono = null;
		}
	}

	/**
	 * Gestion de la barre de progression.
	 */
	progressBar() {
		this.barre_progression.setAttribute('value', this.temps_ecoule); // mise à jour de la valeur courante de la barre de progression
		this.barre_progression.labels[0].innerText = this.temps_ecoule + " s / " + this.duree + " s";
	}

	/**
	 * Enregistrement du temps de la partie.
	 */
	enregistrerTemps() {
		// fetch permet d'envoyer le temps écoulé.
		// Attention : ici la formation de la requête est faite manuellement
		// et on ne fait aucun contrôle de retour d'exécution (POST OK / KO)
		fetch(this.url_ws, {
			method: 'POST',
			headers: {'Content-Type':'application/x-www-form-urlencoded'},
			body: 'temps=' + this.temps_ecoule
		});
	}

	/**
	 * Récupération et affichage des meilleurs temps de parties.
	 */
	afficherTemps() {
		let self = this;

		// fetch permet de récupérer la liste des meilleurs temps
		// nous ne gérons pas ici les erreurs
		fetch(this.url_ws, { method: 'GET' })
			// 1 - la réponse est retournée au format JSON...
			.then(function(response) {
				return response.json();
			})
			// 2 - ...qui est utilisé ici pour l'affichage des meilleurs temps
			.then(function(data) {
				let html = ['Meilleurs temps :'];

				// liste de données vide
				if (!data.length) {
					html.push('\nAucun temps enregistré. Soyez le premier !');
				}
				else {
					// parcours des enregistrements
					// le serveur retourne les résultats sous forme d'un tableau JSON
					// que l'on peut directement manipuler sous forme d'objets
					// grâce au retour du premier then()
					data.forEach(function(element) {
						html.push('\n - ' + element.temps + ' s le ' + element.date);
					});
				}
				alert(html.join(''));
			});
	}
}

// lancement du jeu au chargement du fichier
let memory = new Memory();
memory.debut();

