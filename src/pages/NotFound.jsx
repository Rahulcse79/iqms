import React from "react";
import { styled } from "@mui/material/styles";
import { Box, Typography, Button } from "@mui/material";

const NotFoundContainer = styled(Box)({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "white",
    textAlign: "center",
    backgroundColor: "#000",
});

const NotFoundTitle = styled(Typography)({
    fontSize: "6rem",
    fontWeight: "bold",
    color: "#ff4d4d",
    margin: 0,
});

const NotFoundMessage = styled(Typography)({
    fontSize: "1.5rem",
    margin: "10px 0",
    color: "#ccc",
});

const NotFoundLink = styled(Button)({
    marginTop: "20px",
    padding: "10px 20px",
    background: "#ff4d4d",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    transition: "0.3s",
    "&:hover": {
        background: "#ff1a1a",
    },
});

function NotFound() {
    return (
        <NotFoundContainer>
            <NotFoundTitle variant="h1">404</NotFoundTitle>
            <NotFoundMessage>Page Not Found</NotFoundMessage>
            <NotFoundLink href="/app2">Go Home</NotFoundLink>
        </NotFoundContainer>
    );
}

export default NotFound;
