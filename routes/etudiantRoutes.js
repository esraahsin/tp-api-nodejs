const express = require('express');
const router = express.Router();

const {
    getAllEtudiants,
    getEtudiantById,
    createEtudiant,
    updateEtudiant,
    deleteEtudiant,
    getEtudiantsByFiliere,
    searchEtudiants,
    getEtudiantsInactifs,    // ← NOUVEAU
    restoreEtudiant,         // ← NOUVEAU
    hardDeleteEtudiant       // ← NOUVEAU
} = require('../controllers/etudiantcontroller');

// Route de recherche
router.get('/search', searchEtudiants);

// Route pour voir les étudiants inactifs
router.get('/inactifs', getEtudiantsInactifs);  // ← NOUVELLE ROUTE

// Route de recherche par filière
router.get('/filiere/:filiere', getEtudiantsByFiliere);

// Routes principales
router.route('/')
    .get(getAllEtudiants)
    .post(createEtudiant);

// Route pour réactiver un étudiant
router.patch('/:id/restore', restoreEtudiant);  // ← NOUVELLE ROUTE

// Route pour suppression définitive
router.delete('/:id/permanent', hardDeleteEtudiant);  // ← NOUVELLE ROUTE

// Routes avec :id
router.route('/:id')
    .get(getEtudiantById)
    .put(updateEtudiant)
    .delete(deleteEtudiant);  // Soft delete

module.exports = router;
