using System;
using System.Runtime.InteropServices;

namespace CorelTileStudio.Services
{
    /// <summary>
    /// Sustituto portatil de <c>Marshal.GetActiveObject</c>, que fue
    /// eliminado en .NET 5+. Llama a <c>oleaut32!GetActiveObject</c>
    /// directamente via P/Invoke.
    /// </summary>
    internal static class ComUtils
    {
        [DllImport("oleaut32.dll", PreserveSig = false)]
        [return: MarshalAs(UnmanagedType.IUnknown)]
        private static extern object GetActiveObject(ref Guid rclsid, IntPtr reserved);

        public static object GetActiveObject(string progId)
        {
            Type type = Type.GetTypeFromProgID(progId)
                ?? throw new COMException($"ProgID no registrado: {progId}");
            Guid clsid = type.GUID;
            return GetActiveObject(ref clsid, IntPtr.Zero);
        }
    }
}
