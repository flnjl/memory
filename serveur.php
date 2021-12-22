<?php

/*
 * Nous avons :
 * 	- un objet permettant de gérer les accès à la base de données (base SQLite)
 * 	- un objet permettant de gérer les requêtes web.
 *
 * La classe BaseDeDonnees gère l'interface avec la base (création, requêtes...)
 * La classe App gère les demandes en provenance du navigateur. Ici deux types de demandes :
 * 	- GET : qui retourne la liste des meilleurs temps
 * 	- POST : qui permet d'enregistrer un nouveau temps.
 * 
 * C'est une mise en oeuvre minimaliste de la séparation des couches.
 * On peut aller plus loin en développant les concepts MVC et DAO à partir de ces classes.
 */

/**
 * Gestion de la base de données.
 * Attention : aucune gestion de contrôle des erreurs.
 */
class BaseDeDonnees {
	private $db = null;  // ressource PDO vers la base de données

	/**
	 * Constructeur.
	 * Vérifie l'existance de la base de données, création de la base si nécessaire.
	 * Ouvre la connexion à la base de données.
	 */
	function __construct() {
		if (!file_exists('memory.db')) {
			$this->connexion();
			$this->creer();
		}
		else {
			$this->connexion();
		}
	}

	/**
	 * Connexion à la base de données.
	 */
	private function connexion() {
		// connexion à la base via le pilote PDO, 
		// connecteur générique et standard pour différentes bases de données
		$this->db = new PDO('sqlite:memory.db');
	}

	/**
	 * Création de la base de données (création de la table).
	 */
	private function creer() {
		// création de la table
		// la date est enregistrée automatiquement par la base de données au format timestamp à l'heure locale
		$this->db->exec('CREATE TABLE memory (id INTEGER PRIMARY KEY AUTOINCREMENT, temps INTEGER, date_heure TIMESTAMP DEFAULT (DATETIME(\'NOW\',\'LOCALTIME\')))');
	}

	/**
	 * Retourne la liste des meilleurs temps.
	 *
	 * @return array
	 */
	public function listeMeilleursTemps() {
		// à noter : il est possible de chaîner les appels de méthodes lorsque
		// que la réponse d'une méthode est une instance d'objet (query() return un PDOStatement)
		return $this->db->query('SELECT temps, strftime(\'%d-%m-%Y %H:%M:%S\', date_heure) AS date FROM memory ORDER BY temps ASC, date_heure DESC LIMIT 10')
						->fetchAll(PDO::FETCH_ASSOC);
	}

	/**
	 * Enregistre un temps.
	 *
	 * @param int $temps Le temps à enregistrer
	 */
	public function enregistrerTemps($temps) {
		$query = $this->db->prepare('INSERT INTO memory (temps) VALUES (?)');
		$query->execute([$temps]);
	}
}

/**
 * Gestion de l'application.
 * Lors de la réception d'une requête web :
 * 	- identification du type de requête (GET, POST...)
 * 	- appel de la méthode qui traite le type de requête
 *  - utilisation d'une méthode unique pour la création de la réponse au client.
 */
class App {
	/**
	 * Traitement initial de la requête, appel de la méthode effective
	 * de traitement la requête selon la demande.
	 */
	static function dispatch() {
		switch($_SERVER['REQUEST_METHOD']) {
			case 'GET':
				self::actionGet();
				break;

			case 'POST':
				self::actionPost();
				break;

			default:
				self::reponse(404);
				break;
		}
	}

	/**
	 * Gestion d'une demande GET :
	 * 	- lecture de la liste des meilleurs temps en base de données
	 * 	- réponse au client au format JSON.
	 */
	static function actionGet() {
		$db = new BaseDeDonnees();
		$resultats = $db->listeMeilleursTemps();

		self::reponse(200, json_encode($resultats), ['Content-Type: application/json; charset=utf-8']);
	}

	/**
	 * Gestion d'une demande POST :
	 * 	- validation des données du formulaire
	 * 	- réponse d'un code de retour HTTP normalisé.
	 */
	static function actionPost() {
		// vérification on a bien la valeur "temps" ?
		// on regarde si la clé de tableau existe dans le tableau $_POST
		if (!array_key_exists('temps', $_POST)) {
			http_response_code(400); // mauvaise requête, on n'a pas la valeur "temps"
			exit;
		}

		// on pourrait faire d'autres contrôles... nettoyer la donnée...
		// mais on va enregistrer directement la valeur
		$db = new BaseDeDonnees();
		$db->enregistrerTemps($_POST['temps']);
		self::reponse(201); // enregistrement OK, donnée créée
	}

	/**
	 * Envoi de la réponse du serveur au client et termine le process.
	 *
	 * @param int    $code    Code HTTP de la réponse, 200 (KO) par défaut
	 * @param string $corps   Corps de la réponse
	 * @param array  $entetes Entêtes de la réponse.
	 */
	static function reponse($code = 200, $corps = '', $entetes = []) {
		http_response_code($code);

		if (!empty($entetes)) {
			foreach ($entetes as $entete) {
				header($entete);
			}
		}

		if (!empty($corps)) {
			echo $corps;
		}

		exit;
	}
	
}

// vérification : le fichier est-il lancé via une requête web ?
if (isset($_SERVER['REQUEST_METHOD'])) {
	// lancement de l'application
	App::dispatch();
}
