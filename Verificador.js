import React, { useEffect, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { Graph } from "graphology";
import { Sigma } from "sigma";
import Handsontable from "handsontable";
import dagre from "dagre";
import './Verificador.css';
import "bootstrap/dist/css/bootstrap.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

/**
 * 
 * @returns 
 */
function Verificador() {

    const hotTableRef = useRef(null);
    const containerRef = useRef(null); // Contenedor para Sigma.js
    const sigmaInstance = useRef(null); // Referencia al renderizador de Sigma
    // Crear el grafo en formato Graphology
    const [graph] = useState(new Graph()); // Estado del grafo

    const data = [["",""]];
    console.log(Handsontable.version);
    // Inicializar Sigma.js
    useEffect(() => {
        // Configurar Sigma solo una vez
        sigmaInstance.current = new Sigma(graph, containerRef.current);

        // Cleanup al desmontar el componente
        return () => {
            sigmaInstance.current.kill();
        };
    }, [graph]);

    /**
     * 
     */
    const visualizarOrganigrama = () => {

        // Crear el grafo en formato Dagre
        const g = new dagre.graphlib.Graph();
        // Obtener la instancia de Handsontable
        const hotInstance = hotTableRef.current.hotInstance;

        const hotdata = hotInstance.getData(); // Obtén los datos de la tabla
        const baseColor = 'blue';
        // Configuración del grafo
        g.setGraph({
            rankdir: 'TB', // Dirección: TB (Top-Bottom), LR (Left-Right)
            nodesep: 50,   // Separación entre nodos
            ranksep: 100,  // Separación entre filas
        });


        let rowposition = 1;
        hotdata.forEach((row) => {
            let [rutCola, rutJefatura] = row;
            if (!rutCola) {
                return;
            }
            if (!rutJefatura) {
                rutJefatura = rutCola;
            }
            const label = rowposition + ":" + rutCola;
            g.setNode(rutCola, { id: rutCola, parent: rutJefatura, rowposition: rowposition, checkNode: true, label: label, width: 60, height: 40 });
            rowposition++;
        });

        // Agregar aristas
        rowposition = 1;
        hotdata.forEach((row) => {
            let [rutCola, rutJefatura] = row;
            if (!rutCola) {
                return;
            }
            if (!rutJefatura) {
                rutJefatura = rutCola;
            }
            const label = rutJefatura + '-' + rutJefatura;
            // verificar si el rutJefatura existe en la lista de nodos

            if (!g.hasNode(rutJefatura)) {
                const label = "ERROR:" + rowposition + ":" + rutJefatura;
                g.setNode(rutJefatura, { id: rutJefatura, parent: rutJefatura, rowposition: rowposition, checkNode: false, label: label, width: 60, height: 40 });
            }

            g.setEdge(rutCola, rutJefatura, { label: label }); // Aseguramos que cada arista tenga un objeto válido
            rowposition++;
        });


        // Calcular el layout con Dagre
        dagre.layout(g);

        clearGraph();

        // Convertir nodos
        g.nodes().forEach((nodeId) => {
            const node = g.node(nodeId);
            if (!node) {
                return;
            }
            let parentnode;
            if (node.parent) {
                parentnode = g.node(node.parent);
            } else {
                parentnode = node;
            }
            let colornode = baseColor;
            let sizenode = 4;

            if (node.checkNode) {
                if (!(parentnode && parentnode.id)) {
                    colornode = 'black';
                }
                else if (node.id === parentnode.id) {
                    colornode = 'yellow';
                    sizenode = 8;
                }
            } else {
                colornode = 'red';
                sizenode = 8;
            }

            graph.addNode(nodeId, {
                label: node.label,
                x: node.x, // Normaliza las posiciones
                y: node.y, // Invertir coordenada Y para Sigma.js
                size: sizenode,
                color: colornode,
            });
        });

        // Convertir aristas
        g.edges().forEach((edge) => {
            graph.addEdge(edge.v, edge.w, { color: '#ccc', size: 1 });
        });

        // Renderizar con Sigma.js
        // Actualizar Sigma.js
        sigmaInstance.current.refresh();
    }

    // Función para limpiar nodos del grafo
    const clearGraph = () => {
        graph.clear(); // Limpia todos los nodos y aristas
        // setGraph(new Graph()); // Opcional: Actualiza el estado con un grafo vacío
        //sigmaInstance.current.refresh(); // Refrescar la visualización
    };

    return (
        <Row>
            <Col md={4}>
                <HotTable
                    ref={hotTableRef}
                    data={data}
                    colHeaders={["Rut Colaborador", "Rut Jefatura"]}
                    rowHeaders={true} // Mostrar los números de fila
                    filters={true} // Activar filtros
                    colWidths={[200, 200]}
                    dropdownMenu={true} // Menú desplegable
                    columnSorting={true} // Permitir que se ordene las columnas
                    minSpareRows={1} // Permitir agregar nuevas filas (siempre dejar una fila vacía)
                    contextMenu={true} // Menú contextual para opciones como agregar o eliminar filas
                    allowInsertRow={true} // <--- Permite insertar filas al pegar
                    licenseKey='non-commercial-and-evaluation' // Llave para usar Handsontable gratis
                    // 👇 Importante: declarar los plugins necesarios
                    plugins={[
                        Handsontable.plugins.AutoRowSize,
                        Handsontable.plugins.ColumnSorting,
                        Handsontable.plugins.ContextMenu,
                        Handsontable.plugins.DropdownMenu,
                        Handsontable.plugins.Filters,
                        Handsontable.plugins.CopyPaste,
                    ]}
                />
            </Col>
            <Col md={8} className="p-0 m-0">
                <Col md={12} className="p-0 m-0">
                    <button onClick={visualizarOrganigrama}>Visualizar</button>
                </Col>

                <Col md={12} className="p-0 m-0">
                    <div
                        id="graph-container"
                        ref={containerRef}
                        style={{
                            width: "800px",
                            height: "600px",
                            margin: "auto",
                            position: "relative",
                            border: "1px solid #ddd"
                        }} />
                </Col>
            </Col>
        </Row>
    );
}

export default Verificador;
