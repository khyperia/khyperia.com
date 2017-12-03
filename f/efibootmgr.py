#!/usr/bin/env python3

import subprocess
import sys

def run_output(*cmd):
    print("> {}".format(" ".join(cmd)))
    result = subprocess.check_output(cmd, encoding="utf-8")
    print(result)
    return result

lsblk_cache = [None]
def lsblk():
    if not lsblk_cache[0]:
        output = run_output("lsblk", "-rpno", "kname,pkname,parttype")
        output = [line.split() for line in output.splitlines()]
        output = [(line[0], line[1], line[2]) for line in output if len(line) == 3]
        lsblk_cache[0] = output
    return lsblk_cache[0]

def parts_of_type(uuid):
    return [(filepath, parent) for (filepath, parent, typeuuid) in lsblk() if typeuuid == uuid]

def efi_parts():
    return parts_of_type("c12a7328-f81f-11d2-ba4b-00a0c93ec93b")

def linux_parts():
    return parts_of_type("0fc63daf-8483-4772-8e79-3d69d8477de4")

def bootloader(efi, disk, main_part, label):
    if not efi[-1].isdigit():
        print("EFI partition didn't end with digit, can't use efibootmgr")
        return
    part = efi[-1]
    cmdline = "initrd=/intel-ucode.img initrd=/initramfs-linux.img root={} rw".format(main_part)
    args = ["sudo", "efibootmgr", "-d", disk, "-p", part, "-c", "-L", label, "-l", "/vmlinuz-linux", "-u", cmdline]
    print(' '.join(args))
    okay = input('Okay to run? (y/N) ')
    if okay.strip() == "y":
        code = subprocess.call(args)
        if code != 0:
            print("Exec failed with {}".format(code))

def main():
    efis = efi_parts()
    linuxes = linux_parts()
    if len(efis) == 1 and len(linuxes) == 1 and len(sys.argv) == 1:
        (efi, efi_parent) = efis[0]
        (linux, linux_parent) = linuxes[0]
    elif (len(efis) != 1 or len(linuxes) != 1) and len(sys.argv) == 3:
        (efi, efi_parent) = efis[int(sys.argv[1]) - 1]
        (linux, linux_parent) = linuxes[int(sys.argv[2]) - 1]
    elif len(efis) != 1 or len(linuxes) != 1:
        print("More than one EFI or linux partition found")
        print("EFI partitions:")
        print([part for (part, parent) in efis])
        print("linux partitions:")
        print([part for (part, parent) in linuxes])
        print("Usage: efibootmgr.py [efi partition] [linux partition]")
        return
    elif len(sys.argv) != 1:
        print("Usage: efibootmgr.py")
        return
    print("EFI: " + efi)
    print("EFI parent: " + efi_parent)
    print("Linux: " + linux)
    bootloader(efi, efi_parent, linux, "Arch Linux")

if __name__ == "__main__":
    main()
