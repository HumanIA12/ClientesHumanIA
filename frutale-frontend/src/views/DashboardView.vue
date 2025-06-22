<template>
  <div>
    <h1>Dashboard</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const message = ref('Cargando...')

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard')
    message.value = data.message
  } catch (err) {
    message.value = 'Error al conectar con la API'
  }
})
</script>
