'use client';

import { Center, Heading, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Center flexDir="column" h="100vh" p={4}>
      <Heading mb={4}>404 — Página no encontrada</Heading>
      <Text mb={6}>Lo sentimos, no hemos encontrado lo que buscas.</Text>
      <Link href="/" passHref>
        <Button as="a" colorScheme="teal">
          Volver al inicio
        </Button>
      </Link>
    </Center>
  );
}
