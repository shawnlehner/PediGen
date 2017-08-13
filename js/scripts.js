var pediGen = function() {

    var nextExampleTrait = 0;
    var exampleTraitValues = [
        {
            name: "e.g. DOB",
            description: "e.g. 7/17/2017"
        },
        {
            name: "e.g. Weight",
            description: "e.g. 3lbs"
        },
        {
            name: "e.g. Reg #",
            description: "e.g. Z793J"
        },
        {
            name: "e.g. GC #",
            description: "e.g. G987"
        },
        {
            name: "e.g. Ear #",
            description: "e.g. NA77"
        }
    ]

    var addTraitButton = null;
    var traitTableBody = null;

    var traitTemplateText = '';

    var animalList = [];
    var modalCallback = null;

    initialize();

    return {

    };

    function initialize() {
        traitTemplateText = document.getElementById("trait-template").innerHTML;
        traitTableBody = document.getElementById("trait-table-body");

        addTraitButton = document.getElementById("add-trait-button");
        addTraitButton.addEventListener("click", function(e) {
            e.preventDefault();
            addTrait();
        });

        document.getElementById("logo-upload-input").addEventListener("change", handleLogoUpload);
        document.getElementById("upload-logo").addEventListener("click", function(e) {
            e.preventDefault();
            uploadLogo();
        });
        document.getElementById("animal-update-button").addEventListener("click", updateAnimal);
        document.getElementById("animal-cancel-button").addEventListener("click", closeModal);
        document.getElementById("get-started-button").addEventListener("click", getStarted);
        document.getElementById("add-generation").addEventListener("click", function(e) {
            var numGenerations = document.getElementById("pedigree-container").getElementsByClassName("generation").length;
            if (numGenerations > 3) {
                alert("This generator does not currently support more than 3 generations.");
                return;
            }

            var numAnimals = Math.pow(2, numGenerations);

            var animals = [];
            for (var i = 0; i < numAnimals; i++) {

                var even = ((i%2)==0);
                animals.push({
                    name: even ? "Dam" : "Sire",
                    description: "",
                    traits: []
                });
            }

            addGeneration(animals);
        });
        document.getElementById("generate-pedigree").addEventListener("click", generateDocumentSource);
        document.getElementById("print-pedigree").addEventListener("click", function(e) {
            window.print();
        });
        document.getElementById("close-pedigree").addEventListener("click", function(e) {
            document.getElementById("pedigree-modal").style.display = "none";
        });
    }

    function uploadLogo() {
        document.getElementById("logo-upload-input").click();
    }

    function handleLogoUpload() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById("pedigree-header").innerHTML = '<img class="logo" src="' + e.target.result + '">';
            };
            reader.readAsDataURL(this.files[0]);
        }
    }

    function generateDocumentSource() {
        var currentGen = -1;
        var genAnimals = 0;
        
        var animals = animalList.slice();
        var generationCode = '';
        while(animals.length > 0) {
            if (genAnimals == 0) {
                if (currentGen > -1) {
                    // End our last generation
                    generationCode += "</div>";
                }

                generationCode += '<div class="generation">';
                currentGen ++;
                genAnimals = Math.pow(2, currentGen);
                if (genAnimals == 0) genAnimals = 1;
            }

            var a = animals.shift();
            generationCode += '<div class="animal"><div class="animal-wrapper"><strong>' + a.name + '</strong><br>' + a.description + '<br>';
            for(var i = 0; i < a.traits.length; i++) {
                if (i > 0) generationCode += ' - ';
                var t = a.traits[i];
                generationCode += t.name + ': ' + t.description;
            }
            generationCode += '</div></div>';
            genAnimals--;
        }

        generationCode += "</div>";

        document.getElementById("output-footer").innerHTML = document.getElementById("pedigree-footer").innerHTML;
        document.getElementById("output-header").innerHTML = document.getElementById("pedigree-header").innerHTML;
        document.getElementById("pedigree-modal").style.display = "block";
        document.getElementById("output-pedigree").innerHTML = generationCode;
    }

    function getStarted() {
        showEditModal("Add Animal", "Add your animal that you would like to generate a pedigree for", function(adata) {
            document.getElementById("get-started").style.display = "none";
            document.getElementById("generator").style.display = "block";

            addGeneration([adata]);
        });
    }

    function addGeneration(animals) {
        // Create our new generation row
        var newGen = document.createElement("div");
        newGen.className = "generation";

        // Add all of our animals to our new generation
        for(var i = 0; i < animals.length; i++) {
            var index = animalList.length;
            animalList.push(animals[i]);

            var animal = document.createElement("div");
            if (animals[i].name === "Dam" && i > 0) {
                animal.className = "animal newpair";
            } else {
                animal.className = "animal";
            }
            animal.innerHTML = '<div class="wrapper">' + animals[i].name + '</div><div class="info">Click to Edit</div>';

            // Setup our edit click event and scope so we don't let loop creep
            (function(a, ai) {
                a.addEventListener("click", function(e) {
                    showEditModal("Update Animal", "", function(updatedAnimal) {
                        animalList[ai] = updatedAnimal;
                        a.getElementsByClassName("wrapper")[0].innerText = updatedAnimal.name;
                    }, animalList[ai]);
                });
            })(animal, index);

            newGen.appendChild(animal);
        }

        // Add our new generation to the container
        document.getElementById("pedigree-container").appendChild(newGen);
    }

    function showEditModal(title, text, success, animalBase) {
        modalCallback = success;

        document.getElementById("edit-modal").style.display = "block";
        document.getElementById("animal-update-button").innerText = title;

        document.getElementById("animal-form-title").innerText = title;
        document.getElementById("animal-form-prompt").innerText = text;

        if (animalBase) {
            document.getElementById("animal-name").value = animalBase.name;
            document.getElementById("animal-description").value = animalBase.description;

            if (animalBase.traits.length == 0)
                addTrait();
            else {
                for(var i = 0; i < animalBase.traits.length; i++) {
                    addTrait(animalBase.traits[i]);
                }
            }
        } else {
            addTrait();
        }
    }

    function showEditError(error) {
        document.getElementById("animal-edit-error").innerText = error;
    }

    function updateAnimal()
    {
        var animal = {
            name: null,
            description: null,
            traits: []
        };

        animal.name = document.getElementById("animal-name").value;
        if (animal.name.length == 0) {
            showEditError("You must enter a name for this animal.");
            return;
        }

        animal.description = document.getElementById("animal-description").value;

        var traitNameFields = document.getElementsByClassName("trait-name");
        var traitDescriptionFields = document.getElementsByClassName("trait-description");

        for(var i = 0; i < traitNameFields.length; i++) {
            var tn = traitNameFields[i].value;
            if (tn.length == 0) continue;

            animal.traits.push({
                name: traitNameFields[i].value,
                description: traitDescriptionFields[i].value
            })
        }

        if (typeof modalCallback === 'function') {
            modalCallback(animal);
        }

        closeModal();
    }

    function closeModal() {
        document.getElementById("edit-modal").style.display = "none";

        document.getElementById("animal-name").value = "";
        document.getElementById("animal-description").value = "";
        document.getElementById("trait-table-body").innerHTML = "";
        showEditError("");
    }

    function addTrait(trait)
    {
        var example = exampleTraitValues[nextExampleTrait++];
        if (nextExampleTrait >= exampleTraitValues.length) nextExampleTrait = 0;

        var newRow = document.createElement("tr");
        newRow.innerHTML = traitTemplateText;

        var inputs = newRow.getElementsByTagName("input");
        if (typeof inputs[0].placeholder !== 'undefined') {
            inputs[0].placeholder = example.name;
            inputs[1].placeholder = example.description;
        }

        if (trait) {
            inputs[0].value = trait.name;
            inputs[1].value = trait.description;
        }

        traitTableBody.appendChild(newRow);

        var removeLink = newRow.getElementsByClassName("remove-trait")[0];
        removeLink.addEventListener("click", function(e) {
            e.preventDefault();
            this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
        });
    }
}();